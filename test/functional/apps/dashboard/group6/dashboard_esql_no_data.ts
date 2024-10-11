/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { FtrProviderContext } from '../../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const esql = getService('esql');
  const PageObjects = getPageObjects(['discover', 'dashboard']);

  describe('No Data Views: Try ES|QL', () => {
    before(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
    });

    it('enables user to create a dashboard with ES|QL from no-data-prompt', async () => {
      await PageObjects.dashboard.navigateToApp();

      await testSubjects.existOrFail('noDataViewsPrompt');
      await testSubjects.click('tryESQLLink');

      await PageObjects.discover.expectOnDiscover();
      await esql.expectEsqlStatement('FROM logs* | LIMIT 10');
    });
  });
}
