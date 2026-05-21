/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { test as baseTest } from '@kbn/scout';
import type {
  BrowserAuthFixture,
  PageObjects,
  ScoutPage,
  ScoutTestFixtures,
  ScoutWorkerFixtures,
} from '@kbn/scout';

import * as testData from './constants';
import type { MonitoringPageObjects } from './page_objects';
import { extendPageObjects } from './page_objects';

export interface MonitoringTestFixtures extends ScoutTestFixtures {
  pageObjects: MonitoringPageObjects;
}

export const test = baseTest.extend<MonitoringTestFixtures, ScoutWorkerFixtures>({
  pageObjects: async (
    { pageObjects, page }: { pageObjects: PageObjects; page: ScoutPage },
    use: (po: MonitoringPageObjects) => Promise<void>
  ) => {
    await use(extendPageObjects(pageObjects, page));
  },
});

export type { BrowserAuthFixture, MonitoringPageObjects };
export { testData };
