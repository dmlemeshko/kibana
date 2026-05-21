/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Locator, ScoutPage } from '@kbn/scout';

export class ClusterOverviewPage {
  public readonly clusterAlertsContainer: Locator;
  public readonly clusterName: Locator;
  public readonly alertsCreatedToast: Locator;
  public readonly alertsBadge: Locator;
  public readonly setupModeBtn: Locator;
  public readonly exitSetupModeBtn: Locator;

  constructor(private readonly page: ScoutPage) {
    this.clusterAlertsContainer = this.page.testSubj.locator('clusterAlertsContainer');
    this.clusterName = this.page.testSubj.locator('overviewTabsclusterName');
    this.alertsCreatedToast = this.page.testSubj.locator('alertsCreatedToast');
    this.alertsBadge = this.page.testSubj.locator('alertsBadge');
    this.setupModeBtn = this.page.testSubj.locator('monitoringSetupModeBtn');
    this.exitSetupModeBtn = this.page.testSubj.locator('exitSetupModeBtn');
  }

  /** Returns locators for all rendered panel containers (e.g. "Elasticsearch", "Kibana"). */
  panelContainers(): Locator {
    return this.page.locator('[data-test-subj^="clusterItemContainer"]');
  }

  async getPresentPanelNames(): Promise<string[]> {
    const panels = await this.panelContainers().all();
    return Promise.all(
      panels.map(async (el) => {
        const subj = (await el.getAttribute('data-test-subj')) ?? '';
        return subj.replace('clusterItemContainer', '');
      })
    );
  }

  esPanelLocator(field: string): Locator {
    return this.page.testSubj.locator(`clusterItemContainerElasticsearch > ${field}`);
  }

  kbnPanelLocator(field: string): Locator {
    return this.page.testSubj.locator(`clusterItemContainerKibana > ${field}`);
  }

  lsPanelLocator(field: string): Locator {
    return this.page.testSubj.locator(`clusterItemContainerLogstash > ${field}`);
  }

  async acceptAlertsModal() {
    await this.page.testSubj.locator('alerts-modal-button').click();
  }

  async confirmWatcherMigrationDone() {
    await this.page.testSubj.locator('alerts-modal-create-button').click();
  }

  async clickSetupMode() {
    await this.setupModeBtn.click();
  }

  async clickExitSetupMode() {
    await this.exitSetupModeBtn.click();
  }
}
