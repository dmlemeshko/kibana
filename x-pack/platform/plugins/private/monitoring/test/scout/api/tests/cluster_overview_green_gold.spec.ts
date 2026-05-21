/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/overview.js
 *   (Green cluster with Gold license — tests #20)
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_green_gold: archive } = testData.ARCHIVES;

apiTest.describe(
  'Cluster overview — singlecluster_green_gold',
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

    apiTest('Gold license: ML jobs panel is not available', async ({ apiClient }) => {
      const response = await apiClient.post(helpers.monitoringUrl('clusters', clusterUuid), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
      });

      expect(response).toHaveStatusCode(200);
      // Gold license does not include ML
      expect(response.body?.license?.type).toBe('trial');
      // ML jobs panel is license-gated; gold → no ml_jobs in overview payload
      expect(response.body?.ml_jobs ?? null).toBeNull();
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
      expect(response.body?.cluster_state?.status).toBe('green');
      expect(response.body?.cluster_stats?.nodes?.count?.total).toBe(2);
      expect(response.body?.cluster_stats?.indices?.count).toBe(17);
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

    apiTest('Logstash panel shows correct data', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'logstash'),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.logstash_count).toBeGreaterThanOrEqual(1);
    });
  }
);
