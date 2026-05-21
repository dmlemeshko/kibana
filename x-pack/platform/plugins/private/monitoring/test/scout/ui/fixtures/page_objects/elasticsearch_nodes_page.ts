/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Locator, ScoutPage } from '@kbn/scout';

export class ElasticsearchNodesPage {
  public readonly listingPage: Locator;
  public readonly tableContainer: Locator;
  public readonly noDataRow: Locator;
  public readonly filterBar: Locator;

  // Column header sort buttons (data-test-subj on the <th>)
  public readonly sortNameCol: Locator;
  public readonly sortStatusCol: Locator;
  public readonly sortShardsCol: Locator;
  public readonly sortCpuCol: Locator;
  public readonly sortLoadCol: Locator;
  public readonly sortMemoryCol: Locator;
  public readonly sortDiskCol: Locator;

  constructor(private readonly page: ScoutPage) {
    this.listingPage = this.page.testSubj.locator('elasticsearchNodesListingPage');
    this.tableContainer = this.page.testSubj.locator('elasticsearchNodesTableContainer');
    this.noDataRow = this.page.testSubj.locator(
      'elasticsearchNodesTableContainer > monitoringTableNoData'
    );
    this.filterBar = this.page.testSubj.locator(
      'elasticsearchNodesTableContainer > monitoringTableToolBar'
    );

    const sortBtn = (subj: string) =>
      this.page
        .locator(`[data-test-subj="${subj}"] [data-test-subj="tableHeaderSortButton"]`);

    this.sortNameCol = sortBtn('tableHeaderCell_name_0');
    this.sortStatusCol = sortBtn('tableHeaderCell_isOnline_2');
    this.sortShardsCol = sortBtn('tableHeaderCell_shardCount_4');
    this.sortCpuCol = sortBtn('tableHeaderCell_node_cpu_utilization_5');
    this.sortLoadCol = sortBtn('tableHeaderCell_node_load_average_6');
    this.sortMemoryCol = sortBtn('tableHeaderCell_node_jvm_mem_percent_7');
    this.sortDiskCol = sortBtn('tableHeaderCell_node_free_space_8');
  }

  async getRows(): Promise<Locator[]> {
    return this.tableContainer.locator('tr[data-test-subj^="nodeLink-"]').all();
  }

  async getNodeNames(): Promise<string[]> {
    const names = await this.page.testSubj.locator('elasticsearchNodesTableContainer > name').all();
    return Promise.all(names.map((n) => n.innerText()));
  }

  async setFilter(text: string) {
    await this.filterBar.locator('input').fill(text);
  }

  async clearFilter() {
    await this.filterBar.locator('input').clear();
  }
}
