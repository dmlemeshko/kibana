/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/nodes.js
 *   (with offline node — sort by name/status/memory/disk/shards — #28)
 *
 * All 5 FTR sort `it`s are combined into one test with test.step.
 * Archives are loaded once in global.setup.ts — no per-spec beforeAll needed.
 *
 * The skipCloud sorting block (#27) remains deferred (FLAKY #217665).
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';

test.describe(
  'Elasticsearch nodes — table sorting (singlecluster_three_nodes_shard_relocation)',
  { tag: tags.stateful.classic },
  () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true');
      });
    });

    test('table sorting', async ({ browserAuth, page, pageObjects }) => {
      await browserAuth.loginAsAdmin();
      await page.gotoApp('monitoring');
      await pageObjects.clusterOverview.clusterName.waitFor({ timeout: 15000 });

      await page.testSubj.locator('clusterItemContainerElasticsearch > esNumberOfNodes').click();
      await pageObjects.esNodes.listingPage.waitFor({ timeout: 10000 });

      await test.step('sort by name descending: whatever-03 first', async () => {
        await pageObjects.esNodes.sortNameCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[0]).toBe('whatever-03');
      });

      await test.step('sort by name ascending: whatever-01 first', async () => {
        await pageObjects.esNodes.sortNameCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[0]).toBe('whatever-01');
      });

      await test.step('sort by status descending: online nodes listed before offline', async () => {
        await pageObjects.esNodes.sortStatusCol.click();
        await pageObjects.esNodes.sortStatusCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        // whatever-03 is offline — it should appear last when sorting online-first
        expect(names[names.length - 1]).toBe('whatever-03');
      });

      await test.step('sort by memory: offline node (no memory) appears last', async () => {
        await pageObjects.esNodes.sortMemoryCol.click();
        await pageObjects.esNodes.sortMemoryCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names.length).toBe(3);
        // offline node has no memory metric and sorts to the bottom
        expect(names[names.length - 1]).toBe('whatever-03');
      });

      await test.step('sort by disk: offline node (no disk) appears last', async () => {
        await pageObjects.esNodes.sortDiskCol.click();
        await pageObjects.esNodes.sortDiskCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[names.length - 1]).toBe('whatever-03');
      });

      await test.step('sort by shards: offline node (0 shards) appears last', async () => {
        await pageObjects.esNodes.sortShardsCol.click();
        await pageObjects.esNodes.sortShardsCol.click();
        const names = await pageObjects.esNodes.getNodeNames();
        expect(names[names.length - 1]).toBe('whatever-03');
      });
    });
  }
);
