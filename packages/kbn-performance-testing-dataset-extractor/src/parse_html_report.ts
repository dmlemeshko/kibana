/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ToolingLog } from '@kbn/tooling-log';
import Fs from 'fs/promises';
import path from 'path';
// import cheerio from 'cheerio';

const REQUESTS_REGEXP = /(?<=var requests = unpack\(\[)(.*)(?=\]\);)/g;
const RESPONSE_REGEXP = /(?<=var responses = unpack\(\[)(.*)(?=\]\);)/g;
const RESPONSES_PERCENTILES_REGEXP =
  /(?<=var responsetimepercentilesovertimeokPercentiles = unpack\(\[)(.*)(?=\]\);)/g;

const parseData = (str: string, regex: RegExp, log: ToolingLog) => {
  const found = str.match(regex);
  if (found == null) {
    throw Error('Failed to parse Html string');
  }
  return found[0]
    .replaceAll('],[', '].[')
    .split('.')
    .map((i) => {
      const pair = i
        .replaceAll(',[', '.[')
        .replaceAll(/^\[/g, '')
        .replaceAll(/\]$/g, '')
        .split('.');
      let values = null;
      try {
        values = JSON.parse(pair[1], (k, v) => {
          return typeof v === 'object' || isNaN(v) ? v : parseInt(v, 10);
        });
      } catch (err) {
        log.debug('Failed to parse array');
      }
      return { timestamp: parseInt(pair[0], 10), values };
    });
};

const getTimeForResponseThreshold = (
  responsePercentiles: Array<{
    timestamp: number;
    values: any;
  }>,
  responseThresholdInMs: number
) => {
  const resultsAboveThreshold = responsePercentiles.filter(
    (i) => i.values && i.values[9] >= responseThresholdInMs
  );
  if (resultsAboveThreshold.length > 0) {
    return resultsAboveThreshold[0].timestamp;
  } else return -1;
};

const getTimeForActiveUsersToReqs = (
  responses: Array<{
    timestamp: number;
    values: any;
  }>,
  threshold: number
) => {
  const resultsAboveThreshold = responses.filter(
    (i) => i.values && i.values[0] > i.values[1] * threshold
  );
  if (resultsAboveThreshold.length > 0) {
    return resultsAboveThreshold[0].timestamp;
  } else return -1;
};

export const parseHtmlReport = async (reportPath: string, log: ToolingLog) => {
  const htmlPath = path.resolve(reportPath, 'index.html');
  const statsPath = path.resolve(reportPath, 'js', 'stats.json');
  const htmlContent = await Fs.readFile(htmlPath, 'utf-8');
  // const statsJson = await Fs.readFile(statsPath, 'utf-8');
  // const $ = cheerio.load(htmlContent);
  // titles.map((t) => log.info(t));
  // [timestamp, [activeUsers,requests,0]], e.g. [1669026394,[6,6,0]]
  const requests = parseData(htmlContent, REQUESTS_REGEXP, log);
  // [timestamp, [min, 25%, 50%, 75%, 80%, 85%, 90%, 95%, 99%, max]], e.g. 1669026394,[9,11,11,12,13,13,14,15,15,16]
  const responsePercentiles = parseData(htmlContent, RESPONSES_PERCENTILES_REGEXP, log);

  const warmupPhase = responsePercentiles.slice(0, 30);

  const avg75PctResponseTimeDuringWarmup =
    warmupPhase
      .map((i) => i.values[3])
      .filter((i) => i > 0)
      .reduce((a, b) => a + b, 0) / warmupPhase.length;

  log.info(`Warmup: Avg 75 percentile response time - ${avg75PctResponseTimeDuringWarmup} ms`);

  // 1.SLA - constant value per api
  const responseThresholdSLA = 3000;
  // 2. x10 increase
  const responseThresholdX10 = avg75PctResponseTimeDuringWarmup * 10;
  // 3. x100 increase
  const responseThresholdX100 = avg75PctResponseTimeDuringWarmup * 100;
  // 4. #users/#requests > 1.5-2
  const usersToRequestsThreshold = 1.5;
  // 5. abs(response/requests - 1) > 0.1
  // 6. time of first error
  // 7. t0 (average during startup)

  const timeSLA = getTimeForResponseThreshold(responsePercentiles, responseThresholdSLA);
  const timeX10 = getTimeForResponseThreshold(responsePercentiles, responseThresholdX10);
  const timeX100 = getTimeForResponseThreshold(responsePercentiles, responseThresholdX100);
  const timeActiveUsersToReqs = getTimeForActiveUsersToReqs(requests, usersToRequestsThreshold);

  const concurrentUsersSLA =
    timeSLA === -1 ? 'n/a' : requests.find((i) => i.timestamp === timeSLA)?.values[1];
  log.info(`concurrentUsersSLA: ${concurrentUsersSLA}`);
  const concurrentUsersX10 =
    timeX10 === -1 ? 'n/a' : requests.find((i) => i.timestamp === timeX10)?.values[1];
  log.info(`concurrentUsersX10: ${concurrentUsersX10}`);
  const concurrentUsersX100 =
    timeX100 === -1 ? 'n/a' : requests.find((i) => i.timestamp === timeX100)?.values[1];
  log.info(`concurrentUsersX100: ${concurrentUsersX100}`);
  const concurrentUsersActiveUsersToReqsCount =
    timeActiveUsersToReqs === -1
      ? 'n/a'
      : requests.find((i) => i.timestamp === timeActiveUsersToReqs)?.values[1];
  log.info(
    `#users / #requests = ${usersToRequestsThreshold}: ${concurrentUsersActiveUsersToReqsCount}`
  );
};

export const getTelemetryDataFromReport = (reportPath: string, log: ToolingLog) => {};
