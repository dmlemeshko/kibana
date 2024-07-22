/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EsArchiverProvider } from './es_archiver';
import { EsProvider } from './es';
import { KibanaServerProvider } from './kibana_server';
import { RetryService } from './retry';
import { SupertestWithoutAuthProvider } from './supertest_without_auth';
import { SamlAuthProvider } from './saml_auth';

export const services = {
  es: EsProvider,
  kibanaServer: KibanaServerProvider,
  esArchiver: EsArchiverProvider,
  retry: RetryService,
  supertestWithoutAuth: SupertestWithoutAuthProvider,
  samlAuthProvider: SamlAuthProvider,
};
