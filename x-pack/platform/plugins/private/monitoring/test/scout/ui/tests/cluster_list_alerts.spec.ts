/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/list.js
 *   (Alerts — test #18)
 *
 * The alerts modal is NOT suppressed here (we need to interact with it).
 * Teardown deletes monitoring alerts via the alerting REST API.
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';

test.describe('Cluster listing — alerts modal flow', { tag: tags.stateful.classic }, () => {
  test.afterAll(async ({ apiServices }) => {
    // Clean up any monitoring alerts created during the test
    const rules = await apiServices.alerting.rules.find({
      filter: 'alert.attributes.tags: monitoring',
    });
    await Promise.all(
      (rules.data ?? []).map((rule: { id: string }) => apiServices.alerting.rules.delete(rule.id))
    );
  });

  test('accepting the alerts modal shows a creation success toast', async ({
    browserAuth,
    page,
    pageObjects,
  }) => {
    await browserAuth.loginAsAdmin();
    await page.gotoApp('monitoring');
    await pageObjects.clusterList.tableContainer.waitFor({ timeout: 15000 });

    await test.step('accept alerts modal', async () => {
      await pageObjects.clusterList.acceptAlertsModal();
      await pageObjects.clusterList.confirmWatcherMigrationDone();
    });

    await test.step('alerts creation toast appears', async () => {
      await expect(pageObjects.clusterList.alertsCreatedToast).toBeVisible({ timeout: 10000 });
    });
  });
});
