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
 * Tests #9 and #11 from the migration plan:
 *   - custom space with all features enabled → navLinks.monitoring is true
 *   - custom space with monitoring disabled → navLinks.monitoring is false
 *
 * Tests #10 and #12 (actual browser navigation) are in
 *   ui/tests/spaces_navigation.spec.ts
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

apiTest.describe('Stack Monitoring spaces capabilities', { tag: tags.stateful.classic }, () => {
  apiTest(
    'space with all features enabled: navLinks.monitoring is true',
    async ({ samlAuth, apiClient }) => {
      const adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);
      const SPACE_ID = 'monitoring-test-all-features';

      await apiClient.post('api/spaces/space', {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: { id: SPACE_ID, name: SPACE_ID, disabledFeatures: [] },
      });
      try {
        const { cookieHeader } = await samlAuth.asInteractiveUser('admin');
        const response = await apiClient.get(`s/${SPACE_ID}/api/core/capabilities`, {
          headers: { ...testData.COMMON_HEADERS, ...cookieHeader },
        });

        expect(response).toHaveStatusCode(200);
        expect(response.body.navLinks?.monitoring).toBe(true);
      } finally {
        await apiClient.delete(`api/spaces/space/${SPACE_ID}`, {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        });
      }
    }
  );

  apiTest(
    'space with monitoring disabled: navLinks.monitoring is false',
    async ({ samlAuth, apiClient }) => {
      const adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);
      const SPACE_ID = 'monitoring-test-disabled';

      await apiClient.post('api/spaces/space', {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: { id: SPACE_ID, name: SPACE_ID, disabledFeatures: ['monitoring'] },
      });
      try {
        const { cookieHeader } = await samlAuth.asInteractiveUser('admin');
        const response = await apiClient.get(`s/${SPACE_ID}/api/core/capabilities`, {
          headers: { ...testData.COMMON_HEADERS, ...cookieHeader },
        });

        expect(response).toHaveStatusCode(200);
        expect(response.body.navLinks?.monitoring).toBe(false);
      } finally {
        await apiClient.delete(`api/spaces/space/${SPACE_ID}`, {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        });
      }
    }
  );
});
