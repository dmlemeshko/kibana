/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Path from 'path';
import { setTimeout } from 'timers/promises';

import { REPO_ROOT } from '@kbn/repo-info';
import { ToolingLog } from '@kbn/tooling-log';
import { ProcRunner, withProcRunner } from '@kbn/dev-proc-runner';

import { readConfigFile, Config } from '../../functional_test_runner';

import { checkForEnabledTestsInFtrConfig, runFtr } from '../lib/run_ftr';
import { runElasticsearch } from '../lib/run_elasticsearch';
import { runKibanaServer } from '../lib/run_kibana_server';
import { RunTestsOptions } from './flags';

/**
 * Run servers and tests for each config
 */
export async function runTests(log: ToolingLog, options: RunTestsOptions) {
  if (!process.env.CI) {
    log.warning('❗️❗️❗️');
    log.warning('❗️❗️❗️');
    log.warning('❗️❗️❗️');
    log.warning(
      "   Don't forget to use `node scripts/build_kibana_platform_plugins` to build plugins you plan on testing"
    );
    log.warning('❗️❗️❗️');
    log.warning('❗️❗️❗️');
    log.warning('❗️❗️❗️');
  }

  /*
          env: {
          // Reset all the ELASTIC APM env vars to undefined, FTR config might set it's own values.
          ...Object.fromEntries(
            Object.keys(process.env).flatMap((k) =>
              k.startsWith('ELASTIC_APM_') ? [[k, undefined]] : []
            )
          ),
          TEST_PERFORMANCE_PHASE: phase,
          TEST_ES_URL: 'http://elastic:changeme@localhost:9200',
          TEST_ES_DISABLE_STARTUP: 'true',
        },
  */

  async function startKibana(
    procs: ProcRunner,
    config: Config,
    onEarlyExit: (msg: string) => void
  ) {
    await runKibanaServer({
      procs,
      config,
      logsDir: options.logsDir,
      installDir: options.installDir,
      onEarlyExit,
    });
  }

  async function runTest(config: Config, signal: AbortSignal) {
    await runFtr({
      log,
      config,
      esVersion: options.esVersion,
      signal,
    });
  }

  for (const [i, path] of options.configs.entries()) {
    await log.indent(0, async () => {
      if (options.configs.length > 1) {
        const progress = `${i + 1}/${options.configs.length}`;
        log.write(`--- [${progress}] Running ${Path.relative(REPO_ROOT, path)}`);
      }

      const config = await readConfigFile(log, options.esVersion, path);

      const hasTests = await checkForEnabledTestsInFtrConfig({
        config,
        esVersion: options.esVersion,
        log,
      });
      if (!hasTests) {
        // just run the FTR, no Kibana or ES, which will quickly report a skipped test group to ci-stats and continue
        await runFtr({
          log,
          config,
          esVersion: options.esVersion,
        });
        return;
      }

      await withProcRunner(log, async (procs) => {
        const abortCtrl = new AbortController();

        const onEarlyExit = (msg: string) => {
          log.error(msg);
          abortCtrl.abort();
        };

        let shutdownEs;
        try {
          // we start ES only once and keep for both 'warmup' and 'test' Kibana runs
          shutdownEs = await runElasticsearch({ ...options, log, config, onEarlyExit });
          if (abortCtrl.signal.aborted) {
            return;
          }

          Object.fromEntries(
            Object.keys(process.env).flatMap((k) =>
              k.startsWith('ELASTIC_APM_') ? [[k, undefined]] : []
            )
          );

          process.env.TEST_PERFORMANCE_PHASE = 'WARMUP';
          // warmup
          await startKibana(procs, config, onEarlyExit);
          if (abortCtrl.signal.aborted) {
            return;
          }
          await runTest(config, abortCtrl.signal);

          process.env.TEST_PERFORMANCE_PHASE = 'TEST';

          // test
          await startKibana(procs, config, onEarlyExit);
          if (abortCtrl.signal.aborted) {
            return;
          }
          await runTest(config, abortCtrl.signal);
        } finally {
          try {
            const delay = config.get('kbnTestServer.delayShutdown');
            if (typeof delay === 'number') {
              log.info('Delaying shutdown of Kibana for', delay, 'ms');
              await setTimeout(delay);
            }

            await procs.stop('kibana');
          } finally {
            if (shutdownEs) {
              await shutdownEs();
            }
          }
        }
      });
    });
  }
}
