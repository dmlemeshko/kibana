/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Scout UI test: TSVB visualization over a rollup-backed index
 *
 * Builds a TSVB Metric visualization pointing at a rollup target index and
 * asserts the rendered metric value equals `'3'` (one document per past day,
 * three days indexed).
 *
 * This is the only test in the repository that exercises TSVB + rollup-backed
 * indices end-to-end.  No RTL coverage exists for this path.
 *
 * Stateful-only: the rollup plugin is disabled in serverless.
 *   TSVB rollup support also exists only in stateful.
 *
 * Dropped from FTR:
 *  - `kibanaServer.importExport.load('rollup.json')` archive — replaced with
 *    inline `apiServices.dataViews.create({ type: 'rollup', ... })`.
 *  - `PageObjects.timePicker` import — was present but never used.
 *  - `kibanaServer.uiSettings.replace({})` wipe-all — replaced with selective
 *    `kbnClient.uiSettings.unset(...)` per the keys this spec mutated.
 *  - `sleep(3000)` before reading the metric value — replaced with a
 *    polling `expect(...).toHaveText('3', { timeout: 30_000 })`.
 *  - `await pastDates.map(async ...)` missing-await bug — fixed with
 *    `await Promise.all(...map(...))`.
 *  - `retry.try(async () => { await es.rollup.putJob(...) })` blind retry —
 *    removed; `createMockRollupIndex` is awaited first, then putJob is called once.
 */

import { v4 as uuidv4 } from 'uuid';
import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';
import { createMockRollupIndex, deleteMockRollupIndex } from '../fixtures/mock_rollup_index';
import { stopAndDeleteRollupJob } from '../fixtures/rollup_data';

test.describe('Rollup — TSVB metric visualization', { tag: tags.stateful.classic }, () => {
  const runId = uuidv4().slice(0, 8);
  const rollupJobName = `tsvb-test-rollup-job-${runId}`;
  const rollupSourceIndexName = 'rollup-source-data';
  const rollupTargetIndexName = 'rollup-target-data';

  // Fixed past dates matching the FTR suite so the rollup data is predictable.
  const pastDates = [
    new Date('October 15, 2019 05:35:32'),
    new Date('October 15, 2019 05:34:32'),
    new Date('October 15, 2019 05:33:32'),
  ];

  // Time range covering all three documents.
  const fromTime = 'Oct 15, 2019 @ 00:00:01.000';
  const toTime = 'Oct 15, 2019 @ 19:31:44.000';

  let rollupDataViewId: string | undefined;

  test.beforeAll(async ({ esClient, apiServices, kbnClient }) => {
    // ES 8.15+: rollup job creation requires existing rollup usage.
    await createMockRollupIndex(esClient);

    // Seed one source document so the rollup job can be created.
    await esClient.index({
      index: rollupSourceIndexName,
      document: { '@timestamp': new Date().toISOString() },
    });
    await esClient.indices.refresh({ index: rollupSourceIndexName });

    // Create the rollup job via ES API (no retry needed after awaiting mock index).
    await esClient.rollup.putJob({
      id: rollupJobName,
      body: {
        index_pattern: rollupSourceIndexName,
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

    // Index 3 rolled-up docs (one per past date) — these produce metric value '3'.
    await Promise.all(
      pastDates.map((day) =>
        esClient.index({
          index: rollupTargetIndexName,
          document: {
            '_rollup.version': 2,
            '@timestamp.date_histogram.time_zone': 'UTC',
            '@timestamp.date_histogram.timestamp': day.toISOString(),
            '@timestamp.date_histogram.interval': '1000ms',
            '@timestamp.date_histogram._count': 1,
            '_rollup.id': rollupJobName,
          },
        })
      )
    );
    await esClient.indices.refresh({ index: rollupTargetIndexName });

    // Create the rollup data view inline — replaces loading the rollup.json archive.
    const created = await apiServices.dataViews.create({
      title: 'rollup*',
      type: 'rollup',
      typeMeta: { params: { rollup_index: rollupTargetIndexName } },
      timeFieldName: '@timestamp.date_histogram.timestamp',
    });
    rollupDataViewId = created.id;

    // Set UI settings needed for TSVB over rollup indices.
    await kbnClient.uiSettings.update({
      defaultIndex: rollupDataViewId,
      'metrics:allowStringIndices': true,
      'timepicker:timeDefaults': `{ "from": "${fromTime}", "to": "${toTime}"}`,
    });
  });

  // browserAuth is a per-test fixture and cannot be used in beforeAll.
  test.beforeEach(async ({ browserAuth }) => {
    await browserAuth.loginAsTsvbRollupUser();
  });

  test.afterAll(async ({ esClient, kbnClient }) => {
    await stopAndDeleteRollupJob(esClient, rollupJobName);

    await esClient.indices.delete({
      index: [rollupTargetIndexName, rollupSourceIndexName],
      ignore_unavailable: true,
    });

    await deleteMockRollupIndex(esClient);

    // Reset only the keys this spec touched (no blanket replace({})).
    await kbnClient.uiSettings.unset('defaultIndex');
    await kbnClient.uiSettings.update({ 'metrics:allowStringIndices': false });
    await kbnClient.uiSettings.unset('timepicker:timeDefaults');

    await kbnClient.savedObjects.cleanStandardList();
  });

  test('renders a rollup-backed TSVB metric visualization with value 3', async ({
    pageObjects,
  }) => {
    await test.step('navigate to Visualize and create a TSVB visualization', async () => {
      await pageObjects.visualize.createTSVBVisualization();
      await pageObjects.tsvbEditor.waitForEditorReady();
    });

    await test.step('switch to the Metric visualization type', async () => {
      await pageObjects.tsvbEditor.clickMetricType();
    });

    await test.step('open Panel Options and configure the rollup index', async () => {
      await pageObjects.tsvbEditor.clickPanelOptions('metric');
      // Use raw index name (not a Kibana data view) — matches FTR's `false` flag.
      await pageObjects.tsvbEditor.setRawIndexPattern(rollupTargetIndexName);
      await pageObjects.tsvbEditor.selectTimeField('@timestamp');
    });

    await test.step('configure Last value timerange mode and interval', async () => {
      await pageObjects.tsvbEditor.setDataTimerangeMode('Last value');
      await pageObjects.tsvbEditor.setInterval('1d');
      await pageObjects.tsvbEditor.setDropLastBucket(false);
    });

    await test.step('assert the metric value is 3 (one doc per rolled-up day)', async () => {
      // Playwright polls until the metric renders — replaces the FTR sleep(3000).
      await expect(pageObjects.tsvbEditor.metricValue).toHaveText('3', { timeout: 30_000 });
    });
  });
});
