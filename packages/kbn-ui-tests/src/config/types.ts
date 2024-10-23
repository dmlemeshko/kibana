/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ServerlessProjectType } from '@kbn/es';
import { UrlParts } from '@kbn/test';

export interface ConfigType {
  serverless: boolean;
  servers: {
    kibana: UrlParts;
    elasticsearch: UrlParts;
    fleet?: UrlParts;
  };
  dockerServers: any;
  esTestCluster: {
    from: string;
    license?: string;
    files: string[];
    serverArgs: string[];
    ssl: boolean;
  };
  kbnTestServer: {
    env: any;
    buildArgs: string[];
    sourceArgs: string[];
    serverArgs: string[];
    useDedicatedTastRunner?: boolean;
  };
}

export interface TestServersConfig {
  serverless: boolean;
  projectType?: ServerlessProjectType;
  isCloud: boolean;
  cloudUsersFilePath: string;
  hosts: {
    kibana: string;
    elasticsearch: string;
  };
  auth: {
    username: string;
    password: string;
  };
  metadata?: any;
}

export type SupportedConfigurations =
  | 'stateful'
  | 'serverless=es'
  | 'serverless=oblt'
  | 'serverless=security';
