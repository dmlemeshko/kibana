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
 *   title: Read Rule API endpoint
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';

import { RuleObjectId, RuleSignatureId } from '../../../model/rule_schema/common_attributes.gen';
import { RuleResponse } from '../../../model/rule_schema/rule_schemas.gen';

export type ReadRuleRequestQuery = z.infer<typeof ReadRuleRequestQuery>;
export const ReadRuleRequestQuery = z.object({
  /**
   * The rule's `id` value.
   */
  id: RuleObjectId.optional(),
  /**
   * The rule's `rule_id` value.
   */
  rule_id: RuleSignatureId.optional(),
});
export type ReadRuleRequestQueryInput = z.input<typeof ReadRuleRequestQuery>;

export type ReadRuleResponse = z.infer<typeof ReadRuleResponse>;
export const ReadRuleResponse = RuleResponse;
