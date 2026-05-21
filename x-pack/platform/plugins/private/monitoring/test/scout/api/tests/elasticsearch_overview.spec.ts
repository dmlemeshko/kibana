/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/overview.js
 *
 * Tests #24 from the migration plan.
 * The cluster summary data (nodesCount, indicesCount, memory, shards, etc.)
 * is returned directly by the monitoring API, removing the need for a browser.
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_three_nodes_shard_relocation: archive } = testData.ARCHIVES;

apiTest.describe(
  'Elasticsearch overview — singlecluster_three_nodes_shard_relocation',
  { tag: tags.stateful.classic },
  () => {
    let adminCookieHeader: Awaited<ReturnType<typeof helpers.getAdminCookieHeader>>;
    let clusterUuid: string;

    apiTest.beforeAll(async ({ samlAuth, apiClient }) => {
      adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);

      // Discover the cluster UUID from the clusters endpoint
      const clustersResp = await apiClient.post(helpers.monitoringUrl('clusters'), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
      });
      expect(clustersResp).toHaveStatusCode(200);
      clusterUuid = (clustersResp.body as Array<{ cluster_uuid: string }>)[0].cluster_uuid;
    });

    apiTest('cluster summary has correct info for ES overview', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch'),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      const stats = response.body?.cluster_stats;
      expect(stats?.nodes?.count?.total).toBe(3);
      expect(stats?.indices?.count).toBe(21);
      expect(response.body?.cluster_state?.status).toBe('yellow');
    });

    apiTest('cluster has log data (logs link should appear)', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch'),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      // The "view logs" link is shown when `logs` field is present and non-empty
      expect(response.body?.logs).toBeDefined();
    });
  }
);
