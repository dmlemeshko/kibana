/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/cluster/list.js
 *   (with trial license clusters / multicluster archive)
 *
 * Tests #13 and #15 from the migration plan.
 * The UI click flows (#14) live in ui/tests/cluster_list_actions.spec.ts.
 */

import { expect } from '@kbn/scout/api';
import { tags } from '@kbn/scout';
import { apiTest, testData, helpers } from '../fixtures';

const { multicluster } = testData.ARCHIVES;

apiTest.describe('Cluster listing — multicluster archive', { tag: tags.stateful.classic }, () => {
  let adminCookieHeader: Awaited<ReturnType<typeof helpers.getAdminCookieHeader>>;

  apiTest.beforeAll(async ({ samlAuth }) => {
    adminCookieHeader = await helpers.getAdminCookieHeader(samlAuth);
  });

  apiTest('shows 3 clusters with trial license (multicluster archive)', async ({ apiClient }) => {
    const body = helpers.buildMonitoringBody({ from: multicluster.from, to: multicluster.to });

    const response = await apiClient.post(helpers.monitoringUrl('clusters'), {
      headers: { ...testData.COMMON_HEADERS, ...adminCookieHeader },
      body,
    });

    expect(response).toHaveStatusCode(200);
    expect(response.body).toHaveLength(3);
  });
});
