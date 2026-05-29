/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Client } from '@elastic/elasticsearch';
import datemath from '@kbn/datemath';

/**
 * Returns the last `count` days relative to `now` as moment objects,
 * ordered oldest → newest (now-Nd, ..., now-1d).
 */
export const buildPastDays = (now: Date, count = 3): moment.Moment[] => {
  const days: moment.Moment[] = [];
  for (let i = count; i >= 1; i--) {
    const parsed = datemath.parse(`now-${i}d`, { forceNow: now });
    if (parsed) {
      days.push(parsed);
    }
  }
  return days;
};

/**
 * Returns an ES index params object for a stub source-data document:
 * a timestamped record with a simple metric.  Used to seed the source
 * indices before creating a rollup job.
 */
export const mockIndices = (day: moment.Moment, prepend: string) => ({
  index: `${prepend}-${day.format('MM-DD-YYYY')}`,
  document: {
    '@timestamp': day.toISOString(),
    foo_metric: 1,
  },
});

/**
 * Returns an ES index params object for a stub rolled-up document that
 * mimics the shape produced by a real rollup job.
 */
export const mockRolledUpData = (jobName: string, targetIndexName: string, day: moment.Moment) => ({
  index: targetIndexName,
  document: {
    '_rollup.version': 2,
    '@timestamp.date_histogram.time_zone': 'UTC',
    '@timestamp.date_histogram.timestamp': day.toISOString(),
    '@timestamp.date_histogram.interval': '1000ms',
    '@timestamp.date_histogram._count': 1,
    '_rollup.id': jobName,
  },
});

/**
 * Stops (if running) and then deletes a rollup job by name.
 * Ignores 404s so callers do not need to check existence first.
 */
export const stopAndDeleteRollupJob = async (esClient: Client, jobName: string): Promise<void> => {
  try {
    await esClient.transport.request({
      path: `/_rollup/job/${jobName}/_stop?wait_for_completion=true`,
      method: 'POST',
    });
  } catch {
    // job may already be stopped or never started — ignore
  }

  try {
    await esClient.transport.request({
      path: `/_rollup/job/${jobName}`,
      method: 'DELETE',
    });
  } catch {
    // job may not exist — ignore
  }
};
