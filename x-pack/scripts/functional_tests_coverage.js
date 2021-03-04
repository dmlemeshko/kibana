/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

const alwaysImportedTests = [
  // oss
  require.resolve('../../test/functional/config.js'),
  require.resolve('../../test/plugin_functional/config.ts'),
  require.resolve('../../test/ui_capabilities/newsfeed_err/config.ts'),
  require.resolve('../../test/new_visualize_flow/config.ts'),
  require.resolve('../../test/security_functional/config.ts'),
  require.resolve('../../test/functional/config.legacy.ts'),
  // x-pack
  require.resolve('../test/functional/config.js'),
  require.resolve('../test/functional_basic/config.ts'),
  require.resolve('../test/security_solution_endpoint/config.ts'),
  require.resolve('../test/plugin_functional/config.ts'),
  require.resolve('../test/functional_with_es_ssl/config.ts'),
  require.resolve('../test/functional/config_security_basic.ts'),
  require.resolve('../test/security_functional/login_selector.config.ts'),
  require.resolve('../test/security_functional/oidc.config.ts'),
  require.resolve('../test/security_functional/saml.config.ts'),
  require.resolve('../test/functional_embedded/config.ts'),
  require.resolve('../test/functional_cors/config.ts'),
  require.resolve('../test/functional_enterprise_search/without_host_configured.config.ts'),
];

require('../../src/setup_node_env');
require('@kbn/test').runTestsCli([alwaysImportedTests]);
