/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Scout UI test: Create Rollup Job
 *
 * Exercises the 6-step create-rollup-job wizard end-to-end:
 *   1. Seed 3 days of synthetic source data (ES API).
 *   2. Walk the wizard through all steps.
 *   3. Assert the new job appears in the live rollup jobs list.
 *
 * Stateful-only: the rollup plugin is disabled in serverless
 * (x-pack/platform/plugins/private/rollup/server/config.ts:30–34).
 *
 * CCS branch dropped: the standard rollup_job FTR config never enabled CCS
 * and no other config wires this suite into a CCS run.
 *
 * Deprecation-prompt test dropped: already covered by RTL at
 * x-pack/platform/plugins/private/rollup/public/crud_app/sections/job_list/job_list.test.js:60-64.
 *
 * Role note: the FTR suite ran as superuser because `manage_rollups_role` was
 * broken under FTR plumbing (https://github.com/elastic/kibana/issues/143720).
 * We attempt the narrower `manageRollupsUser` role here.  If the Kibana
 * management app requires additional feature privileges, widen the role in
 * custom_roles.ts rather than using loginAsAdmin.
 */

import { v4 as uuidv4 } from 'uuid';
import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';
import { createMockRollupIndex, deleteMockRollupIndex } from '../fixtures/mock_rollup_index';
import { buildPastDays, mockIndices, stopAndDeleteRollupJob } from '../fixtures/rollup_data';

test.describe('Rollup Jobs — create rollup job wizard', { tag: tags.stateful.classic }, () => {
  // Resource names — fixed prefix + per-run UUID to avoid collisions on re-runs
  const runId = uuidv4().slice(0, 8);
  const rollupJobName = `rollup-to-be-${runId}`;
  const targetIndexName = 'rollup-to-be';
  const sourceIndexPattern = 'to-be*';
  const sourceDataPrepend = 'to-be';

  const now = new Date();
  const pastDates = buildPastDays(now);

  test.beforeAll(async ({ esClient }) => {
    // From ES 8.15+, creating a rollup job requires existing rollup usage in
    // the cluster.  Simulate that by creating a mock rollup index.
    await createMockRollupIndex(esClient);

    // Seed 3 days of source data that the rollup job will aggregate.
    await Promise.all(pastDates.map((day) => esClient.index(mockIndices(day, sourceDataPrepend))));
    await esClient.indices.refresh({ index: `${sourceDataPrepend}-*` });
  });

  // browserAuth is a per-test fixture and cannot be used in beforeAll.
  test.beforeEach(async ({ browserAuth }) => {
    // Log in with the narrower manage-rollups role.
    // NEEDS VERIFICATION: if this role still fails (see issue #143720),
    // switch to loginAsAdmin() and re-open the linked issue.
    await browserAuth.loginAsManageRollupsUser();
  });

  test.afterAll(async ({ esClient, kbnClient }) => {
    await stopAndDeleteRollupJob(esClient, rollupJobName);
    await esClient.indices.delete({
      index: [targetIndexName, `${sourceDataPrepend}-*`],
      ignore_unavailable: true,
    });
    await deleteMockRollupIndex(esClient);
    await kbnClient.savedObjects.cleanStandardList();
  });

  test('creates a rollup job via the wizard and shows it in the job list', async ({
    pageObjects,
  }) => {
    await test.step('navigate to rollup jobs management', async () => {
      await pageObjects.rollup.goto();
    });

    await test.step('walk the create-rollup-job wizard', async () => {
      await pageObjects.rollup.createNewRollUpJob({
        jobName: rollupJobName,
        indexPattern: sourceIndexPattern,
        indexName: targetIndexName,
        interval: '1000ms',
        delay: ' ',
        startImmediately: true,
        scheduledTime: { time: '*/10 * * * * ?', cron: true },
      });
    });

    await test.step('assert the new job appears in the list', async () => {
      await pageObjects.rollup.closeFlyout();
      const jobNames = await pageObjects.rollup.getJobNames();
      expect(jobNames).toContain(rollupJobName);
    });
  });
});
