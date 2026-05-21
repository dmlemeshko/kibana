/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaRole } from '@kbn/scout';

// -------------------------------------------------------------------------
// Monitoring API base path
// -------------------------------------------------------------------------
export const MONITORING_API = 'api/monitoring/v1';

export const COMMON_HEADERS = {
  'kbn-xsrf': 'some-xsrf-token',
  'x-elastic-internal-origin': 'kibana',
  'Content-Type': 'application/json;charset=UTF-8',
} as const;

// -------------------------------------------------------------------------
// Archives and their time ranges
// -------------------------------------------------------------------------
// Each archive has a unique cluster UUID so they can coexist in a single ES.
// `_mb` archives (data streams) are loaded with useCreate in loadAllMonitoringArchives.

export const ARCHIVES = {
  multicluster: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/multicluster',
    from: 'Aug 15, 2017 @ 21:00:00.000',
    to: 'Aug 16, 2017 @ 00:00:00.000',
  },
  standalone_cluster: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/standalone_cluster',
    from: 'Feb 4, 2019 @ 17:50:00.000',
    to: 'Feb 4, 2019 @ 17:52:00.000',
  },
  standalone_cluster_mb: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/standalone_cluster_mb',
    from: 'Feb 4, 2019 @ 17:50:00.000',
    to: 'Feb 4, 2019 @ 17:52:00.000',
  },
  multi_basic: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/multi_basic',
    from: 'Sep 7, 2017 @ 20:12:04.011',
    to: 'Sep 7, 2017 @ 20:18:55.733',
  },
  singlecluster_green_gold: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/singlecluster_green_gold',
    from: 'Aug 23, 2017 @ 21:29:35.267',
    to: 'Aug 23, 2017 @ 21:47:25.556',
  },
  singlecluster_yellow_platinum: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/singlecluster_yellow_platinum',
    from: 'Aug 29, 2017 @ 17:23:47.528',
    to: 'Aug 29, 2017 @ 17:25:50.701',
  },
  singlecluster_yellow_basic: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/singlecluster_yellow_basic',
    from: 'Aug 29, 2017 @ 17:55:43.879',
    to: 'Aug 29, 2017 @ 18:01:34.958',
  },
  singlecluster_three_nodes_shard_relocation: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/singlecluster_three_nodes_shard_relocation',
    // Nodes listing (offline): earlier range that includes an offline node
    from_nodes_offline: 'Oct 5, 2017 @ 20:28:28.475',
    to_nodes_offline: 'Oct 5, 2017 @ 20:34:38.341',
    // Nodes listing (all online) / ES overview / node detail active / index detail
    from: 'Oct 5, 2017 @ 20:31:48.354',
    to: 'Oct 5, 2017 @ 20:35:30.176',
    // Nodes listing (online only filter) / node detail advanced
    to_short: 'Oct 5, 2017 @ 20:35:12.176',
  },
  singlecluster_three_nodes_shard_relocation_mb: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/singlecluster_three_nodes_shard_relocation_mb',
    from_nodes_offline: 'Oct 5, 2017 @ 20:28:28.475',
    to_nodes_offline: 'Oct 5, 2017 @ 20:34:38.341',
    from: 'Oct 5, 2017 @ 20:31:48.354',
    to: 'Oct 5, 2017 @ 20:35:30.176',
    to_short: 'Oct 5, 2017 @ 20:35:12.176',
  },
  singlecluster_red_platinum: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/singlecluster_red_platinum',
    from: 'Oct 6, 2017 @ 19:53:06.748',
    to: 'Oct 6, 2017 @ 20:15:30.212',
  },
  singlecluster_red_platinum_mb: {
    path: 'x-pack/platform/test/fixtures/es_archives/monitoring/singlecluster_red_platinum_mb',
    from: 'Oct 6, 2017 @ 19:53:06.748',
    to: 'Oct 6, 2017 @ 20:15:30.212',
  },
} as const;

// -------------------------------------------------------------------------
// Cluster UUIDs (stable across corresponding archives)
// -------------------------------------------------------------------------
export const CLUSTER_UUIDS = {
  // multicluster archive: trial clusters
  MULTICLUSTER_UNSUPPORTED: '6d-9tDFTRe-qT5GoBytdlQ', // basic license row
  // multi_basic archive
  MULTI_BASIC_UNSUPPORTED: 'kH7C358oRzK6bmNzTeLEug', // non-primary basic (staging)
  MULTI_BASIC_SUPPORTED: 'NDKg6VXAT6-TaGzEK2Zy7g', // primary basic (production)
  // standalone_cluster archive
  STANDALONE: '__standalone_cluster__',
  STANDALONE_SECONDARY: 'lfhHkgqfTy2Vy3SvlPSvXg',
} as const;

// Node resolver IDs (singlecluster_three_nodes_shard_relocation)
export const NODE_UUIDS = {
  MASTER: 'jUT5KdxfRbORSCWkb5zjmA',
  DATA: 'bwQWH-7IQY-mFPpfoaoFXQ',
  OFFLINE_RED: '1jxg5T33TWub-jJL4qP0Wg', // singlecluster_red_platinum archive
} as const;

// -------------------------------------------------------------------------
// Roles
// -------------------------------------------------------------------------

export const MONITORING_USER_ONLY_ROLE: KibanaRole = {
  elasticsearch: {
    cluster: ['monitor'],
    indices: [],
  },
  kibana: [
    {
      base: [],
      feature: {
        monitoring: ['all'],
      },
      spaces: ['*'],
    },
  ],
};

export const GLOBAL_ALL_ROLE: KibanaRole = {
  elasticsearch: {
    cluster: [],
    indices: [{ names: ['logstash-*'], privileges: ['read', 'view_index_metadata'] }],
  },
  kibana: [
    {
      base: ['all'],
      feature: {},
      spaces: ['*'],
    },
  ],
};
