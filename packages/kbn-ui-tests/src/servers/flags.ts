/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import Path from 'path';

import { v4 as uuidV4 } from 'uuid';
import { FlagsReader, FlagOptions } from '@kbn/dev-cli-runner';
import { createFlagError } from '@kbn/dev-cli-errors';
import { REPO_ROOT } from '@kbn/repo-info';
import { SupportedConfigurations } from '../config/types';

export type StartServerOptions = ReturnType<typeof parseFlags>;

export const FLAG_OPTIONS: FlagOptions = {
  string: ['serverless', 'esFrom', 'kibana-install-dir'],
  boolean: ['stateful', 'logToFile'],
  help: `
    --stateful           Start Elasticsearch and Kibana with default ESS configuration
    --serverless         Start Elasticsearch and Kibana with serverless project configuration: es | oblt | security
    --esFrom             Build Elasticsearch from source or run snapshot or serverless. Default: $TEST_ES_FROM or "snapshot"
    --kibana-install-dir Run Kibana from existing install directory instead of from source
    --logToFile          Write the log output from Kibana/ES to files instead of to stdout
  `,
};

export function parseFlags(flags: FlagsReader) {
  const serverlessType = flags.enum('serverless', ['es', 'oblt', 'security']);
  const isStateful = flags.boolean('stateful');

  if ((!serverlessType && !isStateful) || (serverlessType && isStateful)) {
    throw createFlagError(`expected exactly one --serverless=<type> or --stateful flag`);
  }

  const config: SupportedConfigurations = serverlessType
    ? `serverless=${serverlessType}`
    : 'stateful';

  return {
    config,
    esFrom: flags.enum('esFrom', ['source', 'snapshot', 'serverless']),
    installDir: flags.string('kibana-install-dir'),
    logsDir: flags.boolean('logToFile')
      ? Path.resolve(REPO_ROOT, 'data/ftr_servers_logs', uuidV4())
      : undefined,
  };
}
