/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createTestConfig } from '../../config.base';
import { services } from './apm_api_integration/common/services';

export default createTestConfig({
  serverlessProject: 'oblt',
  testFiles: [
    require.resolve('../common'),
    require.resolve('./fleet/fleet.ts'),
    require.resolve('./telemetry/snapshot_telemetry'),
    require.resolve('./cases/post_case'),
  ],
  junit: {
    reportName: 'Serverless Observability API Integration Tests',
  },
  suiteTags: { exclude: ['skipSvlOblt'] },
  services,
});
