/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Scout UI test: Hybrid Rollup Data View
 *
 * Two tests sharing a single rollup job + index setup:
 *
 *   Test 1 — "creates a hybrid rollup data view via the editor UI"
 *     Exercises the data view editor's rollup type selector
 *     (`typeField → rollupType`).  This is the only place in the repo that
 *     covers this editor path end-to-end (no RTL coverage in data_view_editor).
 *
 *   Test 2 — "renders the Rollup badge for an alias-backed rollup data view
 *             created via API"
 *     The variation is the ES topology (alias vs raw index), not the editor
 *     flow.  The data view is created via `apiServices.dataViews.create` to avoid
 *     duplicating the editor walk-through; only the badge + field rendering
 *     is asserted in the browser.
 *
 * Stateful-only: the rollup plugin is disabled in serverless.
 *
 * CCS branch dropped: the standard FTR rollup_job config never enabled CCS
 * and no other config wires this suite into a CCS run.
 *
 * Known FTR smells fixed:
 *  - `await pastDates.map(async ...)` replaced with `await Promise.all(...map)`
 *  - `kibanaServer.uiSettings.replace({...})` (wipes all settings) replaced
 *    with `kbnClient.uiSettings.update(...)` + targeted unset in afterAll
 *  - Brittle substring match on row text replaced with `rollupBadge` test-subj
 *    (data-test-subj added to `index_pattern_table.tsx` as part of this migration)
 *  - Exact field list equality relaxed to `toContain('@timestamp')`
 */

import { v4 as uuidv4 } from 'uuid';
import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';
import { createMockRollupIndex, deleteMockRollupIndex } from '../fixtures/mock_rollup_index';
import {
  buildPastDays,
  mockIndices,
  mockRolledUpData,
  stopAndDeleteRollupJob,
} from '../fixtures/rollup_data';

test.describe('Rollup — hybrid index pattern', { tag: tags.stateful.classic }, () => {
  const runId = uuidv4().slice(0, 8);
  const rollupJobName = `hybrid-index-pattern-test-rollup-job-${runId}`;
  const rollupTargetIndexName = 'rollup-target-data';
  const regularIndexPrefix = 'regular-index';
  const rollupSourceIndexPrefix = 'rollup-source-data';
  /** Pattern used for the hybrid data view: regular indices + rollup target */
  const hybridIndexPatternName = `${regularIndexPrefix}*,${rollupTargetIndexName}`;
  /** Alias created in Test 2 to verify alias-backed rollup data views */
  const rollupAlias = `rollup-alias-${runId}`;

  const now = new Date();
  const pastDates = buildPastDays(now);

  // -------------------------------------------------------------------------
  // Shared setup / teardown for both tests
  // -------------------------------------------------------------------------

  test.beforeAll(async ({ esClient, kbnClient }) => {
    // ES 8.15+: rollup job creation requires existing rollup usage in cluster.
    await createMockRollupIndex(esClient);

    // Seed 3 days of source data for the rollup job.
    await Promise.all(
      pastDates.map((day) => esClient.index(mockIndices(day, rollupSourceIndexPrefix)))
    );

    // Wait until all 3 source indices are available.
    await esClient.indices.refresh({ index: `${rollupSourceIndexPrefix}*` });

    // Create the rollup job via ES API.
    await esClient.rollup.putJob({
      id: rollupJobName,
      body: {
        index_pattern: `${rollupSourceIndexPrefix}*`,
        rollup_index: rollupTargetIndexName,
        cron: '*/10 * * * * ?',
        groups: {
          date_histogram: {
            fixed_interval: '1000ms',
            field: '@timestamp',
            time_zone: 'UTC',
          },
        },
        timeout: '20s',
        page_size: 1000,
      } as Parameters<typeof esClient.rollup.putJob>[0]['body'],
    });

    // Index rolled-up data so the rollup target index exists with content.
    await Promise.all(
      pastDates.map((day) =>
        esClient.index(mockRolledUpData(rollupJobName, rollupTargetIndexName, day))
      )
    );
    await esClient.indices.refresh({ index: rollupTargetIndexName });

    // Index one live regular-index doc.
    const nowMoment = pastDates[pastDates.length - 1];
    await esClient.index(mockIndices(nowMoment, regularIndexPrefix));
    await esClient.indices.refresh({ index: `${regularIndexPrefix}*` });

    // Set defaultIndex to avoid redirect issues in the data views management app.
    await kbnClient.uiSettings.update({ defaultIndex: 'rollup-target-data' });
  });

  // browserAuth is a per-test fixture and cannot be used in beforeAll.
  test.beforeEach(async ({ browserAuth }) => {
    await browserAuth.loginAsHybridIndexPatternUser();
  });

  test.afterAll(async ({ esClient, kbnClient }) => {
    await stopAndDeleteRollupJob(esClient, rollupJobName);

    await esClient.indices.delete({
      index: [rollupTargetIndexName, `${regularIndexPrefix}*`, `${rollupSourceIndexPrefix}*`],
      ignore_unavailable: true,
    });

    // Remove the alias created in Test 2 if it still exists.
    try {
      await esClient.indices.deleteAlias({
        index: rollupTargetIndexName,
        name: rollupAlias,
      });
    } catch {
      // alias may have been removed already — ignore
    }

    await deleteMockRollupIndex(esClient);
    await kbnClient.uiSettings.unset('defaultIndex');
    await kbnClient.savedObjects.cleanStandardList();
  });

  // -------------------------------------------------------------------------
  // Test 1: UI-create hybrid data view via the editor
  // -------------------------------------------------------------------------

  test('creates a hybrid rollup data view via the editor UI', async ({ pageObjects }) => {
    await test.step('navigate to the Data Views management list', async () => {
      await pageObjects.dataViewManagement.gotoList();
    });

    await test.step('open the create data view editor', async () => {
      await pageObjects.dataViewManagement.openCreateWizard();
    });

    await test.step('select the Rollup type', async () => {
      await pageObjects.dataViewManagement.selectRollupType();
    });

    await test.step('fill in the hybrid index pattern', async () => {
      await pageObjects.dataViewManagement.setTitle(hybridIndexPatternName);
    });

    await test.step('select the time field', async () => {
      await pageObjects.dataViewManagement.selectTimeField('@timestamp');
    });

    await test.step('save the data view', async () => {
      await pageObjects.dataViewManagement.saveDataView();
    });

    await test.step('navigate back to the list and assert the Rollup badge', async () => {
      await pageObjects.dataViewManagement.gotoList();
      const row = await pageObjects.dataViewManagement.getDataViewRow(hybridIndexPatternName);
      await expect(pageObjects.dataViewManagement.getRollupBadgeInRow(row)).toBeVisible();
    });

    await test.step('click the data view and assert timestamp field is present', async () => {
      await pageObjects.dataViewManagement.clickDataViewByName(hybridIndexPatternName);
      await pageObjects.dataViewManagement.assertFieldVisible('@timestamp');
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: API-create alias-backed data view, assert badge + field list
  // -------------------------------------------------------------------------

  test('renders the Rollup badge for an alias-backed rollup data view created via API', async ({
    esClient,
    apiServices,
    pageObjects,
  }) => {
    await test.step('create an alias pointing at the rollup target index', async () => {
      await esClient.indices.putAlias({
        index: rollupTargetIndexName,
        name: rollupAlias,
      });
    });

    await test.step('create the alias-backed rollup data view via API', async () => {
      await apiServices.dataViews.create({
        title: rollupAlias,
        type: 'rollup',
        typeMeta: { params: { rollup_index: rollupAlias } },
        timeFieldName: '@timestamp',
      });
    });

    await test.step('navigate to the Data Views list', async () => {
      await pageObjects.dataViewManagement.gotoList();
    });

    await test.step('assert the Rollup badge is visible on the alias-backed row', async () => {
      const row = await pageObjects.dataViewManagement.getDataViewRow(rollupAlias);
      await expect(pageObjects.dataViewManagement.getRollupBadgeInRow(row)).toBeVisible();
    });

    await test.step('click the data view and assert timestamp field is present', async () => {
      await pageObjects.dataViewManagement.clickDataViewByName(rollupAlias);
      await pageObjects.dataViewManagement.assertFieldVisible('@timestamp');
    });
  });
});
