/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Locator, ScoutPage } from '@kbn/scout';

export class ElasticsearchIndicesPage {
  public readonly listingPage: Locator;
  public readonly tableContainer: Locator;
  public readonly noDataRow: Locator;
  public readonly filterBar: Locator;

  constructor(private readonly page: ScoutPage) {
    this.listingPage = this.page.testSubj.locator('elasticsearchIndicesListingPage');
    this.tableContainer = this.page.testSubj.locator('elasticsearchIndicesTableContainer');
    this.noDataRow = this.page.testSubj.locator(
      'elasticsearchIndicesTableContainer > monitoringTableNoData'
    );
    this.filterBar = this.page.testSubj.locator(
      'elasticsearchIndicesTableContainer > monitoringTableToolBar'
    );
  }

  async getRows(): Promise<Locator[]> {
    return this.tableContainer.locator('tr[data-test-subj^="indexLink-"]').all();
  }

  async setFilter(text: string) {
    await this.filterBar.locator('input').fill(text);
  }

  async clearFilter() {
    await this.filterBar.locator('input').clear();
  }

  indexLink(indexName: string): Locator {
    return this.page.testSubj.locator(
      `elasticsearchIndicesTableContainer > indexLink-${indexName}`
    );
  }
}
