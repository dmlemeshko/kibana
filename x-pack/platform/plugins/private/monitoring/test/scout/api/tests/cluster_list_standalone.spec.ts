/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/list.js  (#15 — standalone_cluster)
 *   x-pack/platform/test/functional/apps/monitoring/cluster/list_mb.js (#19 — standalone_cluster_mb)
 *
 * Tests #15 and #19 from the migration plan.
 * Per the 1:1 _mb/legacy decision both archives are loaded and asserted in the same spec.
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { standalone_cluster, standalone_cluster_mb } = testData.ARCHIVES;

apiTest.describe(
  'Cluster listing — standalone cluster archives',
  { tag: tags.stateful.classic },
  () => {
    let adminCookieHeader: Awaited<ReturnType<typeof helpers.getAdminCookieHeader>>;

    apiTest.beforeAll(async ({ samlAuth }) => {
      adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);
    });

    apiTest('standalone_cluster: both cluster UUIDs present', async ({ apiClient }) => {
      const body = helpers.buildMonitoringBody({
        from: standalone_cluster.from,
        to: standalone_cluster.to,
      });

      const response = await apiClient.post(helpers.monitoringUrl('clusters'), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body,
      });

      expect(response).toHaveStatusCode(200);
      const uuids = (response.body as Array<{ cluster_uuid: string }>).map((c) => c.cluster_uuid);
      expect(uuids).toContain(testData.CLUSTER_UUIDS.STANDALONE);
      expect(uuids).toContain(testData.CLUSTER_UUIDS.STANDALONE_SECONDARY);
    });

    apiTest('standalone_cluster_mb: both cluster UUIDs present', async ({ apiClient }) => {
      const body = helpers.buildMonitoringBody({
        from: standalone_cluster_mb.from,
        to: standalone_cluster_mb.to,
      });

      const response = await apiClient.post(helpers.monitoringUrl('clusters'), {
        headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
        body,
      });

      expect(response).toHaveStatusCode(200);
      const uuids = (response.body as Array<{ cluster_uuid: string }>).map((c) => c.cluster_uuid);
      expect(uuids).toContain(testData.CLUSTER_UUIDS.STANDALONE);
      expect(uuids).toContain(testData.CLUSTER_UUIDS.STANDALONE_SECONDARY);
    });
  }
);
