/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/nodes_mb.js
 *   (with offline node — sort tests #33)
 *
 * Per the 1:1 _mb/legacy decision, this is a separate spec.
 * Archives are loaded once in global.setup.ts — no per-spec beforeAll needed.
 * The skipCloud sorting block (#32) remains deferred (FLAKY #217665).
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';

test.describe(
  'Elasticsearch nodes mb — table sorting (singlecluster_three_nodes_shard_relocation_mb)',
  { tag: tags.stateful.classic },
  () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true');
      });
    });

    test('table sorting (mb)', async ({ browserAuth, page, pageObjects }) => {
      await browserAuth.loginAsAdmin();
      await page.gotoApp('monitoring');
      await pageObjects.clusterOverview.clusterName.waitFor({ timeout: 15000 });

      await page.testSubj.locator('clusterItemContainerElasticsearch > esNumberOfNodes').click();
      await pageObjects.esNodes.listingPage.waitFor({ timeout: 10000 });

      await test.step('sort by name descending: whatever-03 first (mb)', async () => {
        await pageObjects.esNodes.sortNameCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[0]).toBe('whatever-03');
      });

      await test.step('sort by name ascending: whatever-01 first (mb)', async () => {
        await pageObjects.esNodes.sortNameCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[0]).toBe('whatever-01');
      });

      await test.step('sort by status: offline node last (mb)', async () => {
        await pageObjects.esNodes.sortStatusCol.click();
        await pageObjects.esNodes.sortStatusCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[names.length - 1]).toBe('whatever-03');
      });

      await test.step('sort by memory: offline node last (mb)', async () => {
        await pageObjects.esNodes.sortMemoryCol.click();
        await pageObjects.esNodes.sortMemoryCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names.length).toBe(3);
        expect(names[names.length - 1]).toBe('whatever-03');
      });

      await test.step('sort by disk: offline node last (mb)', async () => {
        await pageObjects.esNodes.sortDiskCol.click();
        await pageObjects.esNodes.sortDiskCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[names.length - 1]).toBe('whatever-03');
      });

      await test.step('sort by shards: offline node last (mb)', async () => {
        await pageObjects.esNodes.sortShardsCol.click();
        await pageObjects.esNodes.sortShardsCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[names.length - 1]).toBe('whatever-03');
      });
    });
  }
);
