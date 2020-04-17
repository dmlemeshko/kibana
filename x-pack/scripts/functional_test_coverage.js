/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

require('@kbn/plugin-helpers').babelRegister();
require('@kbn/test').runTestsCli([
  // require.resolve('../test/functional/config_news_feed_err.js'),
  require.resolve('../test/functional/config_with_oss.js'),
  require.resolve('../test/functional_endpoint_ingest_failure/config.ts'),
  require.resolve('../test/functional_endpoint/config.ts'),
  require.resolve('../test/functional_with_es_ssl/config.ts'),
  require.resolve('../test/functional/config_security_basic.js'),
  require.resolve('../test/plugin_functional/config.ts'),
]);
