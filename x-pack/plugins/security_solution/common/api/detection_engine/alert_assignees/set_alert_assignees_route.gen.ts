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
 *   title: Assign alerts API endpoint
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';

import { AlertIds } from '../../model/alert.gen';
import { NonEmptyString } from '../../model/primitives.gen';

export type AlertAssignees = z.infer<typeof AlertAssignees>;
export const AlertAssignees = z.object({
  /**
   * A list of users ids to assign.
   */
  add: z.array(NonEmptyString),
  /**
   * A list of users ids to unassign.
   */
  remove: z.array(NonEmptyString),
});

export type SetAlertAssigneesRequestBody = z.infer<typeof SetAlertAssigneesRequestBody>;
export const SetAlertAssigneesRequestBody = z.object({
  /**
   * Details about the assignees to assign and unassign.
   */
  assignees: AlertAssignees,
  /**
   * List of alerts ids to assign and unassign passed assignees.
   */
  ids: AlertIds,
});
export type SetAlertAssigneesRequestBodyInput = z.input<typeof SetAlertAssigneesRequestBody>;
