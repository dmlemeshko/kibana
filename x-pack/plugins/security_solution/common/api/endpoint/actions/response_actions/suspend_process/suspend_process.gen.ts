/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Suspend Process Schema
 *   version: 2023-10-31
 */

import type { z } from '@kbn/zod';

import { KillOrSuspendActionSchema, SuccessResponse } from '../../../model/schema/common.gen';

export type EndpointSuspendProcessActionRequestBody = z.infer<
  typeof EndpointSuspendProcessActionRequestBody
>;
export const EndpointSuspendProcessActionRequestBody = KillOrSuspendActionSchema;
export type EndpointSuspendProcessActionRequestBodyInput = z.input<
  typeof EndpointSuspendProcessActionRequestBody
>;

export type EndpointSuspendProcessActionResponse = z.infer<
  typeof EndpointSuspendProcessActionResponse
>;
export const EndpointSuspendProcessActionResponse = SuccessResponse;
