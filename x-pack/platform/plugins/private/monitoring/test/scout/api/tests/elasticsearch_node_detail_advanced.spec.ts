/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/node_detail.js
 *   (Advanced > Active Nodes — test #37)
 *
 * "Advanced" view uses the same API endpoint; the UI tab only toggles client-side
 * chart visibility. This spec verifies that the endpoint responds successfully for
 * the same node UUIDs used in the active-nodes spec. If it turns out the advanced
 * view requires a dedicated query parameter, this spec will need updating.
 *
 * Flattens the nested `describe('Advanced').describe('Active Nodes')` from FTR.
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import type { ApiClientFixture } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_three_nodes_shard_relocation: archive } = testData.ARCHIVES;

apiTest.describe(
  'Elasticsearch node detail — Advanced tab (singlecluster_three_nodes_shard_relocation)',
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

    const fetchNodeDetail = async (apiClient: ApiClientFixture, nodeUuid: string) => {
      return apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch', 'nodes', nodeUuid),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to_short }),
        }
      );
    };

    apiTest(
      'master node advanced: API responds successfully with node summary',
      async ({ apiClient }) => {
        const response = await fetchNodeDetail(apiClient, testData.NODE_UUIDS.MASTER);
        expect(response).toHaveStatusCode(200);
        expect(response.body?.nodeSummary?.transport_address).toBe('127.0.0.1:9300');
      }
    );

    apiTest(
      'data node advanced: API responds successfully with node summary',
      async ({ apiClient }) => {
        const response = await fetchNodeDetail(apiClient, testData.NODE_UUIDS.DATA);
        expect(response).toHaveStatusCode(200);
        expect(response.body?.nodeSummary?.transport_address).toBe('127.0.0.1:9302');
      }
    );
  }
);
