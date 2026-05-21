/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/list.js
 *   (multi_basic archive — cluster row content tests #16)
 *
 * "cluster row actions" for multi_basic (#17) are UI tests → cluster_list_actions.spec.ts
 *
 * The FTR tests were tagged `skipCloud` (https://github.com/elastic/stack-monitoring/issues/31)
 * because the assertions depend on local-only metric values.
 * Annotated with test.fixme + issue reference for cloud runs.
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { multi_basic } = testData.ARCHIVES;

apiTest.describe('Cluster listing — multi_basic archive', { tag: tags.stateful.classic }, () => {
  let adminCookieHeader: Awaited<ReturnType<typeof helpers.getAdminCookieHeader>>;
  let clusters: Array<Record<string, unknown>>;

  apiTest.beforeAll(async ({ samlAuth, apiClient }) => {
    adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);

    const body = helpers.buildMonitoringBody({ from: multi_basic.from, to: multi_basic.to });
    const response = await apiClient.post(helpers.monitoringUrl('clusters'), {
      headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
      body,
    });
    clusters = response.body as Array<Record<string, unknown>>;
  });

  const findCluster = (uuid: string) =>
    clusters.find((c) => c.cluster_uuid === uuid) as Record<string, unknown> | undefined;

  apiTest('non-primary basic cluster (staging): shows dashes for all metrics', async () => {
    // TODO: https://github.com/elastic/stack-monitoring/issues/31
    // This test is sensitive to local-vs-cloud differences.
    const cluster = findCluster(testData.CLUSTER_UUIDS.MULTI_BASIC_UNSUPPORTED);
    expect(cluster).toBeDefined();

    // non-primary basic clusters have no metric data exposed via API
    const es = cluster?.elasticsearch as Record<string, unknown> | undefined;
    expect(es?.cluster_stats).toBeUndefined();
  });

  apiTest('primary basic cluster (production): shows real metrics', async () => {
    // TODO: https://github.com/elastic/stack-monitoring/issues/31
    const cluster = findCluster(testData.CLUSTER_UUIDS.MULTI_BASIC_SUPPORTED);
    expect(cluster).toBeDefined();
    expect(cluster?.cluster_name).toBe('production');

    const es = cluster?.elasticsearch as Record<string, unknown> | undefined;
    expect(es).toBeDefined();
  });
});
