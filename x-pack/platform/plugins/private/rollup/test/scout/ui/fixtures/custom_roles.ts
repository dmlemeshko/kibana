/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaRole } from '@kbn/scout';

/**
 * Custom roles for rollup Scout UI tests.
 *
 * Role definitions mirror the FTR config.base.ts entries
 * (`manage_rollups_role`, `global_index_pattern_management_all`,
 * `test_rollup_reader`, `global_visualize_all`).
 *
 * NOTE: `manageRollupsUser` maps to `manage_rollups_role` which was commented
 * out in the FTR suite (https://github.com/elastic/kibana/issues/143720).
 * We re-test it here; if it still fails, fall back to `loginAsAdmin()`.
 */
export const CUSTOM_ROLES: Record<string, KibanaRole> = {
  /**
   * Minimum privileges needed to create a rollup job through the Kibana UI.
   * ES: manage + manage_rollup cluster; read/delete/create_index/view_meta on *.
   * Kibana: discover read so the rollup management app can load.
   */
  manageRollupsUser: {
    elasticsearch: {
      cluster: ['manage', 'manage_rollup'],
      indices: [
        {
          names: ['*'],
          privileges: ['read', 'delete', 'create_index', 'view_index_metadata'],
        },
      ],
    },
    kibana: [
      {
        base: [],
        feature: {
          discover: ['read'],
        },
        spaces: ['*'],
      },
    ],
  },

  /**
   * Minimum privileges for creating a hybrid (rollup + regular) data view
   * via the Data Views management UI.
   * Kibana: indexPatterns all on *.
   * ES: read + view_index_metadata on rollup-* and regular-index*.
   */
  hybridIndexPatternUser: {
    elasticsearch: {
      cluster: [],
      indices: [
        {
          names: ['rollup-*', 'regular-index*'],
          privileges: ['read', 'view_index_metadata'],
        },
      ],
    },
    kibana: [
      {
        base: [],
        feature: {
          indexPatterns: ['all'],
        },
        spaces: ['*'],
      },
    ],
  },

  /**
   * Minimum privileges for TSVB visualization tests over a rollup-backed index.
   * Kibana: visualize all.
   * ES: read + view_index_metadata on rollup-* and regular-index*.
   */
  tsvbRollupUser: {
    elasticsearch: {
      cluster: [],
      indices: [
        {
          names: ['rollup-*', 'regular-index*'],
          privileges: ['read', 'view_index_metadata'],
        },
      ],
    },
    kibana: [
      {
        base: [],
        feature: {
          visualize: ['all'],
        },
        spaces: ['*'],
      },
    ],
  },
};
