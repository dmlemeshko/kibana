/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  PageObjects,
  ScoutTestFixtures,
  ScoutWorkerFixtures,
  BrowserAuthFixture,
} from '@kbn/scout';
import { test as baseTest, createLazyPageObject } from '@kbn/scout';
import type { ScoutPage } from '@kbn/scout';
import { RollupPage, DataViewManagementPage, TsvbEditorPage } from './page_objects';
import { CUSTOM_ROLES } from './custom_roles';

export interface RollupBrowserAuthFixture extends BrowserAuthFixture {
  loginAsManageRollupsUser: () => Promise<void>;
  loginAsHybridIndexPatternUser: () => Promise<void>;
  loginAsTsvbRollupUser: () => Promise<void>;
}

export interface RollupTestFixtures extends ScoutTestFixtures {
  browserAuth: RollupBrowserAuthFixture;
  pageObjects: PageObjects & {
    rollup: RollupPage;
    dataViewManagement: DataViewManagementPage;
    tsvbEditor: TsvbEditorPage;
  };
}

export const test = baseTest.extend<RollupTestFixtures, ScoutWorkerFixtures>({
  pageObjects: async (
    {
      pageObjects,
      page,
    }: { pageObjects: RollupTestFixtures['pageObjects']; page: ScoutPage },
    use: (pageObjects: RollupTestFixtures['pageObjects']) => Promise<void>
  ) => {
    await use({
      ...pageObjects,
      rollup: createLazyPageObject(RollupPage, page),
      dataViewManagement: createLazyPageObject(DataViewManagementPage, page),
      tsvbEditor: createLazyPageObject(TsvbEditorPage, page),
    });
  },

  browserAuth: async (
    { browserAuth }: { browserAuth: BrowserAuthFixture },
    use: (auth: RollupBrowserAuthFixture) => Promise<void>
  ) => {
    await use({
      ...browserAuth,
      loginAsManageRollupsUser: () =>
        browserAuth.loginWithCustomRole(CUSTOM_ROLES.manageRollupsUser),
      loginAsHybridIndexPatternUser: () =>
        browserAuth.loginWithCustomRole(CUSTOM_ROLES.hybridIndexPatternUser),
      loginAsTsvbRollupUser: () => browserAuth.loginWithCustomRole(CUSTOM_ROLES.tsvbRollupUser),
    });
  },
});

export { CUSTOM_ROLES };
