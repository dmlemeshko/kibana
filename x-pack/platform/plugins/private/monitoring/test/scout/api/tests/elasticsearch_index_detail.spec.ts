/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/index_detail.js
 *   (Active Indices — tests #43)
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_three_nodes_shard_relocation: archive } = testData.ARCHIVES;

const INDICES = [
  { name: 'avocado-tweets-2017.10.02', expectedHealth: 'green', expectedUnassigned: 0 },
  { name: 'relocation_test', expectedHealth: 'green', expectedUnassigned: 0 },
  { name: 'phone-home', expectedHealth: 'yellow', expectedUnassigned: 1 },
] as const;

apiTest.describe(
  'Elasticsearch index detail — active indices (singlecluster_three_nodes_shard_relocation)',
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

    for (const index of INDICES) {
      apiTest(
        `index "${index.name}" has correct summary (health: ${index.expectedHealth})`,
        async ({ apiClient }) => {
          const response = await apiClient.post(
            helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch', 'indices', index.name),
            {
              headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
              body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
            }
          );

          expect(response).toHaveStatusCode(200);
          expect(response.body?.indexSummary?.status).toBe(index.expectedHealth);
          expect(response.body?.indexSummary?.unassignedShards).toBe(index.expectedUnassigned);
        }
      );
    }

    apiTest('phone-home index shows logs link', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch', 'indices', 'phone-home'),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      expect(response.body?.logs).toBeDefined();
    });
  }
);
