/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { globalSetupHook } from '@kbn/scout';
import { loadAllMonitoringArchives } from '../../api/fixtures/helpers';

/**
 * Loads all monitoring ES archives once before any UI spec workers start.
 * All archives share distinct cluster UUIDs, so they coexist without interference.
 */
globalSetupHook('Load all monitoring ES archives (UI)', async ({ esClient, log }) => {
  await loadAllMonitoringArchives({ esClient, log });
});
