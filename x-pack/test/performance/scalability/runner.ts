/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { withProcRunner } from '@kbn/dev-proc-runner';
import { REPO_ROOT } from '@kbn/utils';
import fs from 'fs';
import path from 'path';
import { createFlagError } from '@kbn/dev-cli-errors';
import { setTimeout as setTimeoutAsync } from 'timers/promises';
import { FtrProviderContext } from '../ftr_provider_context';

const gatlingProjectRootPath: string =
  process.env.GATLING_PROJECT_PATH || path.resolve(REPO_ROOT, '../kibana-load-testing');
const journeysRootPath = process.env.SCALABILITY_JOURNEYS_ROOT_PATH;

/**
 *
 * ScalabilityTestRunner is used to run load simulation against local Kibana instance
 *
 * Use SCALABILITY_JOURNEYS_ROOT_PATH to provide directory with scalability json files
 */
export async function ScalabilityTestRunner({ getService }: FtrProviderContext) {
  const log = getService('log');

  if (!fs.existsSync(gatlingProjectRootPath)) {
    throw createFlagError(
      `Incorrect path to load testing project: '${gatlingProjectRootPath}'\n
    Clone 'elastic/kibana-load-testing' and set path using 'GATLING_PROJECT_PATH' env var`
    );
  }

  if (!journeysRootPath) {
    throw createFlagError(
      `Set path to scalability journeys directory using 'SCALABILITY_JOURNEYS_ROOT_PATH' env var`
    );
  }
  if (!fs.existsSync(journeysRootPath) || !fs.lstatSync(journeysRootPath).isDirectory()) {
    throw createFlagError(
      `Path to scalability journeys '${journeysRootPath}' is invalid or non-directory`
    );
  }

  const jsonsInDir = fs
    .readdirSync(journeysRootPath)
    .filter((file) => path.extname(file) === '.json');

  log.info(`Found ${jsonsInDir.length} json files in path: ${jsonsInDir}`);
  const journeyPaths = jsonsInDir.map((file) => path.resolve(journeysRootPath, file));

  await withProcRunner(log, async (procs) => {
    for (let i = 0; i < journeyPaths.length; i++) {
      await procs.run('gatling: test', {
        cmd: 'mvn',
        args: [
          'gatling:test',
          '-q',
          '-Dgatling.simulationClass=org.kibanaLoadTest.simulation.generic.GenericJourney',
          `-DjourneyPath=${journeyPaths[i]}`,
        ],
        cwd: gatlingProjectRootPath,
        env: {
          ...process.env,
        },
        wait: true,
      });
      // wait a minute between simulations, skip for the last one
      if (i < journeyPaths.length - 1) {
        await setTimeoutAsync(60 * 1000);
      }
    }
  });
}
