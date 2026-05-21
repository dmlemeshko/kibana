/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/nodes_mb.js
 *   (cluster summary assertion — offline node time range)
 *
 * Test #31 from the migration plan. Separate spec from the legacy variant
 * per the 1:1 _mb/legacy decision.
 * The skipCloud sorting block (#32) is deferred (FLAKY).
 * Sorting (#33) and filtering (#34) are UI tests → *_mb.spec.ts variants.
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_three_nodes_shard_relocation_mb: archive } = testData.ARCHIVES;

apiTest.describe(
  'Elasticsearch nodes listing mb — cluster summary (singlecluster_three_nodes_shard_relocation_mb)',
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

    apiTest(
      'with offline node (mb): cluster summary counts 2 nodes and 20 indices',
      async ({ apiClient }) => {
        const response = await apiClient.post(
          helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch', 'nodes'),
          {
            headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
            body: helpers.buildMonitoringBody({
              from: archive.from_nodes_offline,
              to: archive.to_nodes_offline,
            }),
          }
        );

        expect(response).toHaveStatusCode(200);
        const summary = response.body?.clusterStatus;
        expect(summary?.nodesCount).toBe(2);
        expect(summary?.indicesCount).toBe(20);
        expect(summary?.totalShards).toBe(79);
        expect(summary?.unassignedShards).toBe(7);
        expect(summary?.documentCount).toBe(25758);
        expect(summary?.status).toBe('yellow');
      }
    );
  }
);
