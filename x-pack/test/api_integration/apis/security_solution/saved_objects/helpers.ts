/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrSupertest } from '@kbn/ftr-common-functional-services';
import { TimelineType } from '@kbn/security-solution-plugin/common/api/timeline';
import { v4 as uuidv4 } from 'uuid';

export const createBasicTimeline = async (supertest: FtrSupertest, titleToSaved: string) =>
  await supertest
    .post('/api/timeline')
    .set('kbn-xsrf', 'true')
    .send({
      timelineId: null,
      version: null,
      timeline: {
        title: titleToSaved,
      },
    });

export const createBasicTimelineTemplate = async (supertest: FtrSupertest, titleToSaved: string) =>
  await supertest
    .post('/api/timeline')
    .set('kbn-xsrf', 'true')
    .send({
      timelineId: null,
      version: null,
      timeline: {
        title: titleToSaved,
        templateTimelineId: uuidv4(),
        templateTimelineVersion: 1,
        timelineType: TimelineType.template,
      },
    });
