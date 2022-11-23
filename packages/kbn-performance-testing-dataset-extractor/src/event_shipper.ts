/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ToolingLog } from '@kbn/tooling-log';

export interface Event {
  journeyName: string;
  ciBuildId: string;
  usersCountSLA: number;
  usersCountResponseTime10XAvg: number;
  usersCountResponseTime100XAvg: number;
  usersCountRequestsToActiveUsers: number;
  thresholdSLA: number;
}

function eventsToNDJSON(events: Event[]): string {
  return `${events.map((event) => JSON.stringify(event)).join('\n')}\n`;
}

function buildHeaders(clusterUuid: string, version: string) {
  return {
    'content-type': 'application/x-ndjson',
    'x-elastic-cluster-id': clusterUuid,
    'x-elastic-stack-version': version,
  };
}

export class EventsShipper {
  url: string;
  clusterUuid: string;
  version: string;
  log: ToolingLog;

  constructor(url: string, clusterUuid: string, version: string, log: ToolingLog) {
    this.url = url;
    this.clusterUuid = clusterUuid;
    this.version = version;
    this.log = log;
  }

  async send(events: Event[]) {
    const body = eventsToNDJSON(events);
    this.log.debug(`Sending telemetry data: ${JSON.stringify(eventsToNDJSON)}`);

    const response = await fetch(this.url, {
      method: 'POST',
      body,
      headers: buildHeaders(this.clusterUuid, this.version),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Telemetry sending error: ${response.status} - ${await response.text()}`);
    }

    return `${response.status}`;
  }
}
