/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/** ***********************************************************
 *
 *  Run `node scripts/extract_performance_testing_dataset --help` for usage information
 *
 *************************************************************/

import path from 'path';

import { run } from '@kbn/dev-cli-runner';
import { createFlagError } from '@kbn/dev-cli-errors';
import { Journey } from '@kbn/journeys';

import { extractor } from './extractor';
import { parseHtmlReport } from './parse_html_report';

export async function runExtractor() {
  run(
    async ({ log, flags }) => {
      const baseURL = flags['es-url'];
      if (baseURL && typeof baseURL !== 'string') {
        throw createFlagError('--es-url must be a string');
      }
      if (!baseURL) {
        throw createFlagError('--es-url must be defined');
      }

      const username = flags['es-username'];
      if (username && typeof username !== 'string') {
        throw createFlagError('--es-username must be a string');
      }
      if (!username) {
        throw createFlagError('--es-username must be defined');
      }

      const password = flags['es-password'];
      if (password && typeof password !== 'string') {
        throw createFlagError('--es-password must be a string');
      }
      if (!password) {
        throw createFlagError('--es-password must be defined');
      }

      const withoutStaticResources = !!flags['without-static-resources'] || false;
      const buildId = flags.buildId;
      if (buildId && typeof buildId !== 'string') {
        throw createFlagError('--buildId must be a string');
      }
      if (!buildId) {
        throw createFlagError('--buildId must be defined');
      }

      const configPath = flags.config;
      if (typeof configPath !== 'string') {
        throw createFlagError('--config must be a string');
      }
      const journey = await Journey.load(path.resolve(configPath));

      const scalabilitySetup = journey.config.getScalabilityConfig();
      if (!scalabilitySetup) {
        log.warning(
          `'scalabilitySetup' is not defined in config file, output file for Kibana scalability run won't be generated`
        );
      }

      const testData = {
        esArchives: journey.config.getEsArchives(),
        kbnArchives: journey.config.getKbnArchives(),
      };

      return extractor({
        param: {
          journeyName: journey.config.getName(),
          scalabilitySetup,
          testData,
          buildId,
          withoutStaticResources,
        },
        client: {
          baseURL,
          username,
          password,
        },
        log,
      });
    },
    {
      description: `CLI to fetch and normalize APM traces for journey scalability testing`,
      flags: {
        string: ['config', 'buildId', 'es-url', 'es-username', 'es-password'],
        boolean: ['without-static-resources'],
        help: `
          --config <config_path>     path to an FTR config file that sets scalabilitySetup and journeyName (stored as 'labels.journeyName' in APM-based document)
          --buildId <buildId>        BUILDKITE_JOB_ID or uuid generated locally, stored in APM-based document as label: 'labels.testBuildId'
          --es-url <url>             url for Elasticsearch (APM cluster)
          --es-username <username>   username for Elasticsearch (APM cluster)
          --es-password <password>   password for Elasticsearch (APM cluster)
          --without-static-resources filters out traces with url path matching static resources pattern
        `,
      },
    }
  );
}

export async function reporter() {
  run(
    async ({ log, flags }) => {
      const reportPath = flags.reportPath;
      if (typeof reportPath !== 'string') {
        throw createFlagError('--reportPath must be a string');
      }

      await parseHtmlReport(path.resolve(reportPath), log);
    },
    {
      description: `CLI to parse Gatling html report and push results to the Telemetry cluster`,
      flags: {
        string: ['config', 'reportPath'],
        help: `
      --config <config_path>     path to an FTR config file that sets scalabilitySetup and journeyName (stored as 'labels.journeyName' in APM-based document)
      --reportPath <report_path> absolute path to Gatling report
      `,
      },
    }
  );
}

export async function sendResultsToTelemetry() {
  run(
    async ({ log, flags }) => {
      const reportPath = flags.reportPath;
      if (typeof reportPath !== 'string') {
        throw createFlagError('--reportPath must be a string');
      }

      // const events = getTelemetryDataFromReport(path.resolve(reportPath), log);
      // const shipper = new EventsShipper(
      //   'https://telemetry-staging.elastic.co/v3/send/my-channel-name?debug=true',
      //   'abc-123',
      //   '7.10.0',
      //   log
      // );

      // const responseStatus = await shipper.send(events);
      // log.info(`Telemetry events were sent, 'responseStatus' = ${responseStatus}`);
    },
    {
      description: `CLI to parse Gatling html report and push results to the Telemetry cluster`,
      flags: {
        string: ['buildId', 'config', 'reportPath'],
        help: `
      --buildId <buildId>        BUILDKITE_JOB_ID or uuid generated locally, stored in APM-based document as label: 'labels.testBuildId'
      --config <config_path>     path to an FTR config file that sets scalabilitySetup and journeyName (stored as 'labels.journeyName' in APM-based document)
      --reportPath <report_path> absolute path to Gatling report
      `,
      },
    }
  );
}
