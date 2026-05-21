/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/indices.js
 *   (filter tests #41)
 *
 * The cluster summary assertion (#39) is an API test.
 * The sorted-rows table test (#40) is deferred (EUI issue #1322).
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';


test.describe(
  'Elasticsearch indices — filtering (singlecluster_red_platinum)',
  { tag: tags.stateful.classic },
  () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true');
      });
    });

    test('filtering indices', async ({ browserAuth, page, pageObjects }) => {
      await browserAuth.loginAsAdmin();
      await page.gotoApp('monitoring');
      await pageObjects.clusterOverview.clusterName.waitFor({ timeout: 15000 });

      // Navigate to indices listing via the ES indices panel link
      await page.testSubj.locator('clusterItemContainerElasticsearch > esNumberOfIndices').click();
      await pageObjects.esIndices.listingPage.waitFor({ timeout: 10000 });

      await test.step('filter narrows table to 9 rows for "000"', async () => {
        await pageObjects.esIndices.setFilter('000');
        const rows = await pageObjects.esIndices.getRows();
        expect(rows.length).toBe(9);
        await pageObjects.esIndices.clearFilter();
      });

      await test.step('filter for non-existent index shows no-data row', async () => {
        await pageObjects.esIndices.setFilter('foobar');
        await expect(pageObjects.esIndices.noDataRow).toBeVisible({ timeout: 5000 });
        await pageObjects.esIndices.clearFilter();
      });
    });
  }
);
