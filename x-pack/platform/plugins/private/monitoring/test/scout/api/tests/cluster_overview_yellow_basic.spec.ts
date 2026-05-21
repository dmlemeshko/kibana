/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/overview.js
 *   (Yellow cluster with Basic license — all assertions from #22)
 *
 * The "shows only elasticsearch panel" UI assertion is validated via the API:
 * absence of kibana/logstash data in the cluster detail response confirms that
 * only the Elasticsearch panel would be rendered.
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_yellow_basic: archive } = testData.ARCHIVES;

apiTest.describe(
  'Cluster overview — singlecluster_yellow_basic',
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

    apiTest('Basic license: no alerts panel', async ({ apiClient }) => {
      const response = await apiClient.post(helpers.monitoringUrl('clusters', clusterUuid), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
      });

      expect(response).toHaveStatusCode(200);
      // Basic license has no alerting
      expect(response.body?.alerts ?? null).toBeNull();
    });

    apiTest('Basic license: no ML jobs', async ({ apiClient }) => {
      const response = await apiClient.post(helpers.monitoringUrl('clusters', clusterUuid), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
      });

      expect(response).toHaveStatusCode(200);
      expect(response.body?.ml_jobs ?? null).toBeNull();
    });

    apiTest('Elasticsearch panel data is correct', async ({ apiClient }) => {
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
      expect(response.body?.cluster_stats?.indices?.count).toBe(7);
    });

    apiTest(
      'Basic license cluster: only Elasticsearch panel is present (no Kibana, no Logstash)',
      async ({ apiClient }) => {
        // Validates the UI assertion "shows only elasticsearch panel":
        // if the cluster detail has no kibana/logstash stacks, only the ES panel renders.
        const response = await apiClient.post(helpers.monitoringUrl('clusters', clusterUuid), {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        });

        expect(response).toHaveStatusCode(200);
        // No Kibana nodes for this single-product Basic cluster
        expect(response.body?.kibana?.count ?? 0).toBe(0);
        // No Logstash nodes
        expect(response.body?.logstash?.node_count ?? 0).toBe(0);
      }
    );
  }
);
