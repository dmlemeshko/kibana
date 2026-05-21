/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/node_detail_mb.js
 *   (Active Nodes, Offline Node, Advanced — test #38)
 *
 * Per the 1:1 _mb/legacy decision, this is a separate spec.
 * Uses singlecluster_three_nodes_shard_relocation_mb (active/advanced)
 * and singlecluster_red_platinum_mb (offline).
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_three_nodes_shard_relocation_mb: archiveActive } = testData.ARCHIVES;
const { singlecluster_red_platinum_mb: archiveOffline } = testData.ARCHIVES;

apiTest.describe(
  'Elasticsearch node detail mb — active + offline + advanced',
  { tag: tags.stateful.classic },
  () => {
    let adminCookieHeader: Awaited<ReturnType<typeof helpers.getAdminCookieHeader>>;
    let activeClusterUuid: string;
    let offlineClusterUuid: string;

    apiTest.beforeAll(async ({ samlAuth, apiClient }) => {
      adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);

      const activeResp = await apiClient.post(helpers.monitoringUrl('clusters'), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archiveActive.from, to: archiveActive.to }),
      });
      expect(activeResp).toHaveStatusCode(200);
      activeClusterUuid = (activeResp.body as Array<{ cluster_uuid: string }>)[0].cluster_uuid;

      const offlineResp = await apiClient.post(helpers.monitoringUrl('clusters'), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body: helpers.buildMonitoringBody({ from: archiveOffline.from, to: archiveOffline.to }),
      });
      expect(offlineResp).toHaveStatusCode(200);
      offlineClusterUuid = (offlineResp.body as Array<{ cluster_uuid: string }>)[0].cluster_uuid;
    });

    apiTest('master node (mb): transport address is correct', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl(
          'clusters',
          activeClusterUuid,
          'elasticsearch',
          'nodes',
          testData.NODE_UUIDS.MASTER
        ),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archiveActive.from, to: archiveActive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.nodeSummary?.transport_address).toBe('127.0.0.1:9300');
    });

    apiTest('data node (mb): transport address is correct', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl(
          'clusters',
          activeClusterUuid,
          'elasticsearch',
          'nodes',
          testData.NODE_UUIDS.DATA
        ),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archiveActive.from, to: archiveActive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.nodeSummary?.transport_address).toBe('127.0.0.1:9302');
    });

    apiTest('master node logs link (mb)', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl(
          'clusters',
          activeClusterUuid,
          'elasticsearch',
          'nodes',
          testData.NODE_UUIDS.MASTER
        ),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archiveActive.from, to: archiveActive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.logs).toBeDefined();
    });

    apiTest('offline node (mb): isOnline is false', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl(
          'clusters',
          offlineClusterUuid,
          'elasticsearch',
          'nodes',
          testData.NODE_UUIDS.OFFLINE_RED
        ),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archiveOffline.from, to: archiveOffline.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.nodeSummary?.transport_address).toBe('127.0.0.1:9302');
      expect(response.body?.nodeSummary?.isOnline).toBe(false);
    });

    apiTest('master node advanced (mb): API responds successfully', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl(
          'clusters',
          activeClusterUuid,
          'elasticsearch',
          'nodes',
          testData.NODE_UUIDS.MASTER
        ),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archiveActive.from, to: archiveActive.to_short }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.nodeSummary?.transport_address).toBe('127.0.0.1:9300');
    });

    apiTest('data node advanced (mb): API responds successfully', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl(
          'clusters',
          activeClusterUuid,
          'elasticsearch',
          'nodes',
          testData.NODE_UUIDS.DATA
        ),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archiveActive.from, to: archiveActive.to_short }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.nodeSummary?.transport_address).toBe('127.0.0.1:9302');
    });
  }
);
