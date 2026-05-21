/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/overview.js
 *   (Yellow cluster with Platinum license — tests #21)
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_yellow_platinum: archive } = testData.ARCHIVES;

apiTest.describe(
  'Cluster overview — singlecluster_yellow_platinum',
  { tag: tags.stateful.classic },
  () => {
    let adminCookieHeader: Awaited<ReturnType<typeof helpers.getAdminCookieHeader>>;
    let clusterUuid: string;

    apiTest.beforeAll(async ({ samlAuth, apiClient }) => {
      adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);

      const clustersResp = await apiClient.post(helpers.monitoringUrl('clusters'), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
      });
      expect(clustersResp).toHaveStatusCode(200);
      clusterUuid = (clustersResp.body as Array<{ cluster_uuid: string }>)[0].cluster_uuid;
    });

    apiTest('Platinum license: ML jobs panel is present', async ({ apiClient }) => {
      const response = await apiClient.post(helpers.monitoringUrl('clusters', clusterUuid), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
      });

      expect(response).toHaveStatusCode(200);
      // Platinum → ML jobs panel is visible; ml_jobs is an array (may be empty)
      expect(Array.isArray(response.body?.ml_jobs)).toBe(true);
    });

    apiTest('Elasticsearch panel shows correct data', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch'),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.cluster_state?.status).toBe('yellow');
      expect(response.body?.cluster_stats?.nodes?.count?.total).toBe(1);
      expect(response.body?.cluster_stats?.indices?.count).toBe(8);
    });

    apiTest('Kibana panel shows correct data', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'kibana'),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.kibanas?.length).toBeGreaterThanOrEqual(1);
    });
  }
);
