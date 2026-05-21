/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/list.js
 *   (UI click flows — tests #14 and #17)
 *
 * Data assertions (#13, #15, #16, #19) are API tests.
 * The alerts modal flow (#18) is in cluster_list_alerts.spec.ts.
 *
 * Archives are loaded once in global.setup.ts — no per-spec beforeAll needed.
 * #17 tests tagged `skipCloud` — annotated with test.fixme per plan.
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test, testData } from '../fixtures';

test.describe('Cluster listing — UI actions', { tag: tags.stateful.classic }, () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true');
    });
  });

  test('multicluster: clicking a basic cluster row shows a license-warning toast', async ({
    browserAuth,
    page,
    pageObjects,
  }) => {
    await browserAuth.loginAsAdmin();
    await page.gotoApp('monitoring');
    await pageObjects.clusterList.tableContainer.waitFor({ timeout: 15000 });

    const link = pageObjects.clusterList.clusterLink(
      testData.CLUSTER_UUIDS.MULTICLUSTER_UNSUPPORTED
    );
    await link.click();
    await expect(pageObjects.clusterList.licenseWarningToast).toBeVisible({ timeout: 5000 });
  });

  // TODO: https://github.com/elastic/stack-monitoring/issues/31
  test('multi_basic: clicking the non-primary basic cluster shows a license-warning toast', async ({
    browserAuth,
    page,
    pageObjects,
  }) => {
    await browserAuth.loginAsAdmin();
    await page.gotoApp('monitoring');
    await pageObjects.clusterList.tableContainer.waitFor({ timeout: 15000 });

    const link = pageObjects.clusterList.clusterLink(
      testData.CLUSTER_UUIDS.MULTI_BASIC_UNSUPPORTED
    );
    await link.click();
    await expect(pageObjects.clusterList.licenseWarningToast).toBeVisible({ timeout: 5000 });
  });

  // TODO: https://github.com/elastic/stack-monitoring/issues/31
  test('multi_basic: clicking the primary basic cluster navigates to cluster overview', async ({
    browserAuth,
    page,
    pageObjects,
  }) => {
    await browserAuth.loginAsAdmin();
    await page.gotoApp('monitoring');
    await pageObjects.clusterList.tableContainer.waitFor({ timeout: 15000 });

    const link = pageObjects.clusterList.clusterLink(testData.CLUSTER_UUIDS.MULTI_BASIC_SUPPORTED);
    await link.click();

    await expect(pageObjects.clusterOverview.clusterName).toBeVisible({ timeout: 10000 });
    expect(await pageObjects.clusterOverview.clusterName.innerText()).toBe('production');

    await page.testSubj.locator('breadcrumbClusters').click();
    await expect(pageObjects.clusterList.tableContainer).toBeVisible({ timeout: 10000 });
  });
});
