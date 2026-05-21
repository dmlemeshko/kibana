/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/feature_controls/monitoring_security.ts
 *
 * Tests #5, #6, #7 from the migration plan:
 *   - monitoring_user only → no Kibana access (forbidden login)
 *   - global_all only → navlink absent
 *   - monitoring_user + global_all → navlink present
 *
 * Test #8 (monitoring_user + kibana_admin → denial page) is covered by a
 * Jest/RTL component test: public/components/no_data/no_data_denial.test.js
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData } from '../fixtures';

apiTest.describe('Stack Monitoring security capabilities', { tag: tags.stateful.classic }, () => {
  apiTest(
    'monitoring_user only: capabilities show monitoring as unavailable',
    async ({ samlAuth, apiClient }) => {
      const { cookieHeader } = await samlAuth.asInteractiveUser(testData.MONITORING_USER_ONLY_ROLE);

      const response = await apiClient.get('api/core/capabilities', {
        headers: { ...testData.COMMON_HEADERS, ...cookieHeader },
      });

      expect(response).toHaveStatusCode(200);
      // monitoring_user without kibana access cannot use any Kibana apps
      expect(response.body.navLinks?.monitoring ?? false).toBe(false);
    }
  );

  apiTest(
    'global_all (no monitoring feature): navLinks.monitoring is false',
    async ({ samlAuth, apiClient }) => {
      const { cookieHeader } = await samlAuth.asInteractiveUser(testData.GLOBAL_ALL_ROLE);

      const response = await apiClient.get('api/core/capabilities', {
        headers: { ...testData.COMMON_HEADERS, ...cookieHeader },
      });

      expect(response).toHaveStatusCode(200);
      expect(response.body.navLinks?.monitoring).toBe(false);
    }
  );

  apiTest(
    'monitoring_user + global_all: navLinks.monitoring is true',
    async ({ samlAuth, apiClient }) => {
      const combinedRole = {
        elasticsearch: {
          ...testData.MONITORING_USER_ONLY_ROLE.elasticsearch,
          ...testData.GLOBAL_ALL_ROLE.elasticsearch,
        },
        kibana: [
          ...(testData.MONITORING_USER_ONLY_ROLE.kibana ?? []),
          ...(testData.GLOBAL_ALL_ROLE.kibana ?? []),
        ],
      };

      const { cookieHeader } = await samlAuth.asInteractiveUser(combinedRole);

      const response = await apiClient.get('api/core/capabilities', {
        headers: { ...testData.COMMON_HEADERS, ...cookieHeader },
      });

      expect(response).toHaveStatusCode(200);
      expect(response.body.navLinks?.monitoring).toBe(true);
    }
  );
});
