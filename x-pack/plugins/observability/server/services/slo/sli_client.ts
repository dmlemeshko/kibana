/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  AggregationsAggregationContainer,
  AggregationsDateRangeAggregate,
  AggregationsSumAggregate,
  AggregationsValueCountAggregate,
  MsearchMultisearchBody,
} from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { ElasticsearchClient } from '@kbn/core/server';
import { occurrencesBudgetingMethodSchema, timeslicesBudgetingMethodSchema } from '@kbn/slo-schema';
import { assertNever } from '@kbn/std';
import { SLO_DESTINATION_INDEX_PATTERN } from '../../assets/constants';
import { DateRange, Duration, IndicatorData, SLO } from '../../domain/models';
import { toDateRange } from '../../domain/services/date_range';
import { InternalQueryError } from '../../errors';

export interface SLIClient {
  fetchSLIDataFrom(
    slo: SLO,
    lookbackWindows: LookbackWindow[]
  ): Promise<Record<WindowName, IndicatorData>>;
}

type WindowName = string;

interface LookbackWindow {
  name: WindowName;
  duration: Duration;
}

type EsAggregations = Record<WindowName, AggregationsDateRangeAggregate>;

export class DefaultSLIClient implements SLIClient {
  constructor(private esClient: ElasticsearchClient) {}

  async fetchSLIDataFrom(
    slo: SLO,
    lookbackWindows: LookbackWindow[]
  ): Promise<Record<WindowName, IndicatorData>> {
    const sortedLookbackWindows = [...lookbackWindows].sort((a, b) =>
      a.duration.isShorterThan(b.duration) ? 1 : -1
    );
    const longestLookbackWindow = sortedLookbackWindows[0];
    const longestDateRange = toDateRange({
      duration: longestLookbackWindow.duration,
      type: 'rolling',
    });

    if (occurrencesBudgetingMethodSchema.is(slo.budgetingMethod)) {
      const result = await this.esClient.search<unknown, EsAggregations>({
        ...commonQuery(slo, longestDateRange),
        index: SLO_DESTINATION_INDEX_PATTERN,
        aggs: toLookbackWindowsAggregationsQuery(sortedLookbackWindows),
      });

      return handleWindowedResult(result.aggregations, lookbackWindows);
    }

    if (timeslicesBudgetingMethodSchema.is(slo.budgetingMethod)) {
      const result = await this.esClient.search<unknown, EsAggregations>({
        ...commonQuery(slo, longestDateRange),
        index: SLO_DESTINATION_INDEX_PATTERN,
        aggs: toLookbackWindowsSlicedAggregationsQuery(slo, sortedLookbackWindows),
      });

      return handleWindowedResult(result.aggregations, lookbackWindows);
    }

    assertNever(slo.budgetingMethod);
  }
}

function commonQuery(
  slo: SLO,
  dateRange: DateRange
): Pick<MsearchMultisearchBody, 'size' | 'query'> {
  return {
    size: 0,
    query: {
      bool: {
        filter: [
          { term: { 'slo.id': slo.id } },
          { term: { 'slo.revision': slo.revision } },
          {
            range: {
              '@timestamp': { gte: dateRange.from.toISOString(), lt: dateRange.to.toISOString() },
            },
          },
        ],
      },
    },
  };
}

function toLookbackWindowsAggregationsQuery(sortedLookbackWindow: LookbackWindow[]) {
  return sortedLookbackWindow.reduce<Record<string, AggregationsAggregationContainer>>(
    (acc, lookbackWindow) => ({
      ...acc,
      [lookbackWindow.name]: {
        date_range: {
          field: '@timestamp',
          ranges: [{ from: `now-${lookbackWindow.duration.format()}/m`, to: 'now/m' }],
        },
        aggs: {
          good: { sum: { field: 'slo.numerator' } },
          total: { sum: { field: 'slo.denominator' } },
        },
      },
    }),
    {}
  );
}

function toLookbackWindowsSlicedAggregationsQuery(slo: SLO, lookbackWindows: LookbackWindow[]) {
  return lookbackWindows.reduce<Record<string, AggregationsAggregationContainer>>(
    (acc, lookbackWindow) => ({
      ...acc,
      [lookbackWindow.name]: {
        date_range: {
          field: '@timestamp',
          ranges: [
            {
              from: `now-${lookbackWindow.duration.format()}/m`,
              to: 'now/m',
            },
          ],
        },
        aggs: {
          good: {
            sum: {
              field: 'slo.isGoodSlice',
            },
          },
          total: {
            value_count: {
              field: 'slo.isGoodSlice',
            },
          },
        },
      },
    }),
    {}
  );
}

function handleWindowedResult(
  aggregations: Record<WindowName, AggregationsDateRangeAggregate> | undefined,
  lookbackWindows: LookbackWindow[]
): Record<WindowName, IndicatorData> {
  if (aggregations === undefined) {
    throw new InternalQueryError('Invalid aggregation response');
  }

  const indicatorDataPerLookbackWindow: Record<WindowName, IndicatorData> = {};
  for (const lookbackWindow of lookbackWindows) {
    const windowAggBuckets = aggregations[lookbackWindow.name]?.buckets ?? [];
    if (!Array.isArray(windowAggBuckets) || windowAggBuckets.length === 0) {
      throw new InternalQueryError('Invalid aggregation bucket response');
    }
    const bucket = windowAggBuckets[0];
    const good = (bucket.good as AggregationsSumAggregate).value;
    const total = (bucket.total as AggregationsValueCountAggregate).value;
    if (good === null || total === null) {
      throw new InternalQueryError('Invalid aggregation sum bucket response');
    }

    indicatorDataPerLookbackWindow[lookbackWindow.name] = {
      good,
      total,
      dateRange: { from: new Date(bucket.from_as_string!), to: new Date(bucket.to_as_string!) },
    };
  }

  return indicatorDataPerLookbackWindow;
}
