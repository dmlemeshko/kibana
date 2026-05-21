/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/nodes_mb.js
 *   (only online nodes — filter tests #34)
 *
 * Per the 1:1 _mb/legacy decision, this is a separate spec.
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';


test.describe(
  'Elasticsearch nodes mb — filtering (singlecluster_three_nodes_shard_relocation_mb)',
  { tag: tags.stateful.classic },
  () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true');
      });
    });

    test('filtering nodes (mb)', async ({ browserAuth, page, pageObjects }) => {
      await browserAuth.loginAsAdmin();
      await page.gotoApp('monitoring');
      await pageObjects.clusterOverview.clusterName.waitFor({ timeout: 15000 });

      await page.testSubj.locator('clusterItemContainerElasticsearch > esNumberOfNodes').click();
      await pageObjects.esNodes.listingPage.waitFor({ timeout: 10000 });

      await test.step('filter to a specific node (mb)', async () => {
        await pageObjects.esNodes.setFilter('01');
        const rows = await pageObjects.esNodes.getRows();
        expect(rows.length).toBe(1);
        await pageObjects.esNodes.clearFilter();
      });

      await test.step('filter for non-existent node shows no-data row (mb)', async () => {
        await pageObjects.esNodes.setFilter('foobar');
        await expect(pageObjects.esNodes.noDataRow).toBeVisible({ timeout: 5000 });
        await pageObjects.esNodes.clearFilter();
      });
    });
  }
);
