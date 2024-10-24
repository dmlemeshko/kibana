/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { ElasticsearchClient } from '@kbn/core/server';
import type { ESSearchRequest, InferSearchResponseOf } from '@kbn/es-types';
import type {
  BaseFlameGraph,
  ProfilingStatusResponse,
  StackTraceResponse,
} from '@kbn/profiling-utils';

export interface ProfilingESClient {
  search<TDocument = unknown, TSearchRequest extends ESSearchRequest = ESSearchRequest>(
    operationName: string,
    searchRequest: TSearchRequest
  ): Promise<InferSearchResponseOf<TDocument, TSearchRequest>>;
  profilingStacktraces({}: {
    query: QueryDslQueryContainer;
    sampleSize: number;
    durationSeconds: number;
    co2PerKWH?: number;
    datacenterPUE?: number;
    pervCPUWattX86?: number;
    pervCPUWattArm64?: number;
    awsCostDiscountRate?: number;
    costPervCPUPerHour?: number;
  }): Promise<StackTraceResponse>;
  profilingStatus(params?: { waitForResourcesCreated?: boolean }): Promise<ProfilingStatusResponse>;
  getEsClient(): ElasticsearchClient;
  profilingFlamegraph({}: {
    query: QueryDslQueryContainer;
    sampleSize: number;
    durationSeconds: number;
    co2PerKWH?: number;
    datacenterPUE?: number;
    pervCPUWattX86?: number;
    pervCPUWattArm64?: number;
    awsCostDiscountRate?: number;
    costPervCPUPerHour?: number;
  }): Promise<BaseFlameGraph>;
}
