/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/overview.js
 *   (Alerts → setup mode — test #23)
 *
 * Two FTR `it`s (nested inside `describe('when create alerts options is selected')`)
 * are flattened into one test with test.step.
 *
 * The alerts modal is NOT suppressed here (we interact with it).
 * Auto-refresh is triggered by waiting for the alertsBadge locator with a longer timeout
 * rather than using a fixed `setTimeout(1000)`.
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';

test.describe(
  'Cluster overview — alerts modal → setup mode flow',
  { tag: tags.stateful.classic },
  () => {
    test.afterAll(async ({ apiServices }) => {
      const rules = await apiServices.alerting.rules.find({
        filter: 'alert.attributes.tags: monitoring',
      });
      await Promise.all(
        (rules.data ?? []).map((rule: { id: string }) => apiServices.alerting.rules.delete(rule.id))
      );
    });

    test('accepting alerts modal then entering setup mode shows alerts badge', async ({
      browserAuth,
      page,
      pageObjects,
    }) => {
      await browserAuth.loginAsAdmin();
      await page.gotoApp('monitoring');
      await pageObjects.clusterOverview.clusterName.waitFor({ timeout: 15000 });

      await test.step('accept alerts modal', async () => {
        await pageObjects.clusterOverview.acceptAlertsModal();
        await pageObjects.clusterOverview.confirmWatcherMigrationDone();
        await expect(pageObjects.clusterOverview.alertsCreatedToast).toBeVisible({
          timeout: 10000,
        });
      });

      await test.step('enter setup mode and wait for alerts badge', async () => {
        await pageObjects.clusterOverview.clickSetupMode();
        // The badge appears after the next auto-refresh tick; wait up to 10s instead of
        // using a fixed 1s sleep.
        await expect(pageObjects.clusterOverview.alertsBadge).toBeVisible({ timeout: 10000 });
      });

      await test.step('exit setup mode', async () => {
        await pageObjects.clusterOverview.clickExitSetupMode();
        await expect(pageObjects.clusterOverview.exitSetupModeBtn).not.toBeVisible({
          timeout: 5000,
        });
      });
    });
  }
);
