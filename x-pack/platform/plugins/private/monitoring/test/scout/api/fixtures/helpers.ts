/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EsArchiver } from '@kbn/es-archiver';
import { REPO_ROOT } from '@kbn/repo-info';
import type { Client } from '@elastic/elasticsearch';
import type { SamlAuth } from '@kbn/scout';
import type { ToolingLog } from '@kbn/tooling-log';

import { ARCHIVES, COMMON_HEADERS, MONITORING_API } from './constants';

/** Data-stream archives use paths ending in `_mb` and require bulk `create` ops. */
const isDataStreamArchive = (path: string) => path.endsWith('_mb');

/**
 * Loads all monitoring ES archives once (global.setup.ts).
 * Legacy archives use loadIfNeeded; `_mb` data-stream archives use load with useCreate.
 */
export const loadAllMonitoringArchives = async ({
  esClient,
  log,
}: {
  esClient: Client;
  log: ToolingLog;
}) => {
  const archiver = new EsArchiver({
    log,
    client: esClient,
    baseDir: REPO_ROOT,
    dataOnly: true,
  });

  for (const archive of Object.values(ARCHIVES)) {
    log.debug(`[setup] loading archive ${archive.path} (if needed)...`);
    if (isDataStreamArchive(archive.path)) {
      await archiver.load(archive.path, { skipExisting: true, useCreate: true });
    } else {
      await archiver.loadIfNeeded(archive.path);
    }
  }
};

/**
 * Returns the cookie header for the built-in `admin` interactive user.
 * Use for all monitoring API requests that require elevated privileges.
 */
export const getAdminCookieHeader = async (samlAuth: SamlAuth) => {
  const { cookieHeader } = await samlAuth.asInteractiveUser('admin');
  return cookieHeader;
};

/**
 * Build the standard monitoring POST body for cluster-scoped API calls.
 */
export const buildMonitoringBody = (timeRange: { from: string; to: string }) => ({
  timeRange: {
    min: timeRange.from,
    max: timeRange.to,
  },
});

/**
 * Builds the full monitoring endpoint URL (without leading slash).
 * e.g. monitoringUrl('clusters') → 'api/monitoring/v1/clusters'
 */
export const monitoringUrl = (...parts: string[]) => `${MONITORING_API}/${parts.join('/')}`;

export { COMMON_HEADERS };
