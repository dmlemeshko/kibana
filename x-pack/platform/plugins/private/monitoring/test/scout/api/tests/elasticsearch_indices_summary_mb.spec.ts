/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/elasticsearch/indices_mb.js
 *   (cluster summary assertion from #42)
 *
 * Per the 1:1 _mb/legacy decision, this is a separate spec from the legacy variant.
 * The sorted-rows table test is deferred (EUI issue #1322).
 * Filter tests (#42 filter) are UI tests → elasticsearch_indices_filtering_mb.spec.ts
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { singlecluster_red_platinum_mb: archive } = testData.ARCHIVES;

apiTest.describe(
  'Elasticsearch indices listing mb — cluster summary (singlecluster_red_platinum_mb)',
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

    apiTest('cluster summary has correct info for indices listing (mb)', async ({ apiClient }) => {
      const response = await apiClient.post(
        helpers.monitoringUrl('clusters', clusterUuid, 'elasticsearch', 'indices'),
        {
          headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
          body: helpers.buildMonitoringBody({ from: archive.from, to: archive.to }),
        }
      );

      expect(response).toHaveStatusCode(200);
      const summary = response.body?.clusterStatus;
      expect(summary?.nodesCount).toBe(1);
      expect(summary?.indicesCount).toBe(19);
      expect(summary?.totalShards).toBe(46);
      expect(summary?.unassignedShards).toBe(23);
      expect(summary?.documentCount).toBe(4535);
      expect(summary?.status).toBe('red');
    });
  }
);
