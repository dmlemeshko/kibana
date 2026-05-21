/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Locator, ScoutPage } from '@kbn/scout';

export class ClusterListPage {
  public readonly tableContainer: Locator;
  public readonly noDataRow: Locator;
  public readonly filterBar: Locator;
  public readonly licenseWarningToast: Locator;
  public readonly alertsCreatedToast: Locator;

  constructor(private readonly page: ScoutPage) {
    this.tableContainer = this.page.testSubj.locator('clusterTableContainer');
    this.noDataRow = this.page.testSubj.locator('monitoringTableNoData');
    this.filterBar = this.page.testSubj.locator('clusterTableContainer > monitoringTableToolBar');
    this.licenseWarningToast = this.page.testSubj.locator('monitoringLicenseWarning');
    this.alertsCreatedToast = this.page.testSubj.locator('alertsCreatedToast');
  }

  async gotoApp() {
    await this.page.gotoApp('monitoring');
    await this.tableContainer.waitFor();
  }

  clusterRow(clusterUuid: string): Locator {
    return this.page.testSubj.locator(`clusterTableContainer > clusterRow_${clusterUuid}`);
  }

  clusterLink(clusterUuid: string): Locator {
    return this.page.testSubj.locator(
      `clusterTableContainer > clusterRow_${clusterUuid} > clusterLink`
    );
  }

  async getRows(): Promise<Locator[]> {
    return this.page.testSubj.locator('clusterTableContainer > clusterRow').all();
  }

  async setFilter(text: string) {
    const input = this.filterBar.locator('input');
    await input.fill(text);
  }

  async clearFilter() {
    const input = this.filterBar.locator('input');
    await input.clear();
  }

  async acceptAlertsModal() {
    await this.page.testSubj.locator('alerts-modal-button').click();
  }

  async confirmWatcherMigrationDone() {
    await this.page.testSubj.locator('alerts-modal-create-button').click();
  }
}
