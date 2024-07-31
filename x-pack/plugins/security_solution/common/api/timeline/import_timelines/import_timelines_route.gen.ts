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
 *   title: Elastic Security - Timeline - Import Timelines API
 *   version: 2023-10-31
 */

import { z } from 'zod';

import { Readable, ImportTimelineResult } from '../model/components.gen';

export type ImportTimelinesRequestBody = z.infer<typeof ImportTimelinesRequestBody>;
export const ImportTimelinesRequestBody = z.object({
  file: Readable.merge(
    z.object({
      hapi: z.object({
        filename: z.string(),
        headers: z.object({}),
        isImmutable: z.enum(['true', 'false']).optional(),
      }),
    })
  ),
});
export type ImportTimelinesRequestBodyInput = z.input<typeof ImportTimelinesRequestBody>;

export type ImportTimelinesResponse = z.infer<typeof ImportTimelinesResponse>;
export const ImportTimelinesResponse = z.object({
  data: ImportTimelineResult,
});
