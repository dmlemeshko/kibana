/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/feature_controls/monitoring_spaces.ts
 *
 * Tests #10 and #12 from the migration plan:
 *   - custom space with all features → can navigate to monitoring app
 *   - custom space with monitoring disabled → 404 on navigation
 *
 * Capability assertions (#9 and #11) live in api/tests/spaces_capabilities.spec.ts
 */

import { tags } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import { test } from '../fixtures';

test.describe('Stack Monitoring — spaces navigation', { tag: tags.stateful.classic }, () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true');
    });
  });

  test('can navigate to monitoring app in a space with all features enabled', async ({
    browserAuth,
    page,
    kbnClient,
  }) => {
    const SPACE_ID = 'monitoring-ui-all-features';
    await kbnClient.spaces.create({ id: SPACE_ID, name: SPACE_ID, disabledFeatures: [] });
    try {
      await browserAuth.loginAsAdmin();
      await page.goto(`/s/${SPACE_ID}/app/monitoring`);
      await expect(page.testSubj.locator('monitoringAppContainer')).toBeVisible({ timeout: 15000 });
    } finally {
      await kbnClient.spaces.delete(SPACE_ID);
    }
  });

  test('navigating to monitoring in a space with monitoring disabled returns 404', async ({
    browserAuth,
    page,
    kbnClient,
  }) => {
    const SPACE_ID = 'monitoring-ui-disabled';
    await kbnClient.spaces.create({
      id: SPACE_ID,
      name: SPACE_ID,
      disabledFeatures: ['monitoring'],
    });
    try {
      await browserAuth.loginAsAdmin();
      await page.goto(`/s/${SPACE_ID}/app/monitoring`);
      await expect(page.testSubj.locator('errorPage')).toBeVisible({ timeout: 10000 });
    } finally {
      await kbnClient.spaces.delete(SPACE_ID);
    }
  });
});
