/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ScoutPage, Locator } from '@kbn/scout';
import { EuiComboBoxWrapper } from '@kbn/scout';

/**
 * Rollup-specific page object for the Data Views management UI.
 *
 * This covers ONLY the rollup-specific interactions not available in the
 * built-in `@kbn/scout` `DataViewsManagementPage` / `DataViewEditorPage`:
 *
 *  - `selectRollupType()` — switches the data view editor to Rollup mode
 *     (`typeField → rollupType`).  The only test in the repo exercising this
 *     path.
 *  - `selectTimeField()` — sets the timestamp field combobox (the built-in
 *     `DataViewEditorPage` only reads the current value, not sets it).
 *  - Row-level helpers: `getDataViewRow`, `getRollupBadgeInRow`,
 *     `clickDataViewByName`, `getFieldNames`.
 *
 * Temporary methods — remove once PR #270902 lands and these are available
 * in `@kbn/scout` as `pageObjects.dataViewsManagement.goto()` and
 * `pageObjects.dataViewsManagement.openCreateWizard()`:
 *  - `gotoList()` — `page.gotoApp` + `table.waitFor`
 *  - `openCreateWizard()` — `createButton.click` + flyout wait
 *  - `saveDataView()` — waits for validation then saves (will move to
 *     `pageObjects.dataViewEditor.save()` from the PR)
 */
export class DataViewManagementPage {
  private readonly timestampFieldComboBox: EuiComboBoxWrapper;

  constructor(private readonly page: ScoutPage) {
    this.timestampFieldComboBox = new EuiComboBoxWrapper(
      this.page.testSubj.locator('timestampField')
    );
  }

  // ---------------------------------------------------------------------------
  // TODO: remove once PR #270902 lands — replace with:
  //   pageObjects.dataViewsManagement.goto()
  // ---------------------------------------------------------------------------
  async gotoList(): Promise<void> {
    await this.page.gotoApp('management/kibana/dataViews');
    await this.page.testSubj.locator('indexPatternTable').waitFor({ state: 'visible' });
  }

  // ---------------------------------------------------------------------------
  // TODO: remove once PR #270902 lands — replace with:
  //   pageObjects.dataViewsManagement.openCreateWizard()
  // ---------------------------------------------------------------------------
  async openCreateWizard(): Promise<void> {
    await this.page.testSubj.click('createDataViewButton');
    await this.page.testSubj.locator('indexPatternEditorFlyout').waitFor({ state: 'visible' });
  }

  // ---------------------------------------------------------------------------
  // Rollup-specific editor interactions (no built-in equivalent)
  // ---------------------------------------------------------------------------

  /**
   * Selects the Rollup type in the data view editor.
   * Unique to rollup: no built-in page object covers `typeField → rollupType`.
   */
  async selectRollupType(): Promise<void> {
    await this.page.testSubj.click('typeField');
    await this.page.testSubj.click('rollupType');
  }

  /**
   * Fills the index pattern / title field.
   * TODO: replace with `pageObjects.dataViewEditor.setTitle(title)` once
   * PR #270902 lands — it also waits for `data-validation-error="0"`.
   */
  async setTitle(title: string): Promise<void> {
    const input = this.page.testSubj.locator('createIndexPatternTitleInput');
    await input.fill(title);
    // Wait for async validation to settle.
    await this.page.testSubj
      .locator('indexPatternEditorForm')
      .and(this.page.locator('[data-validation-error="0"]'))
      .waitFor({ state: 'visible' });
  }

  /**
   * Selects the time field from the EuiComboBox (setter).
   * The built-in DataViewEditorPage only reads the current value.
   */
  async selectTimeField(timeField: string): Promise<void> {
    await this.page.testSubj
      .locator('timestampField')
      .and(this.page.locator('[data-is-loading="0"]'))
      .waitFor({ state: 'visible' });
    await this.timestampFieldComboBox.selectOption(timeField);
  }

  /**
   * Saves the data view and waits for the flyout to close.
   * TODO: replace with `pageObjects.dataViewEditor.save()` once PR #270902 lands.
   */
  async saveDataView(): Promise<void> {
    await this.page.testSubj.locator('saveIndexPatternButton').click();
    await this.page.testSubj.locator('indexPatternEditorFlyout').waitFor({ state: 'hidden' });
  }

  // ---------------------------------------------------------------------------
  // List-page row helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the table row `Locator` for the data view whose row text includes `name`.
   */
  async getDataViewRow(name: string): Promise<Locator> {
    const row = this.page
      .locator('[data-test-subj="indexPatternTable"] .euiTableRow')
      .filter({ hasText: name });
    await row.waitFor({ state: 'visible' });
    return row;
  }

  /**
   * Returns the rollup badge locator within a specific table row.
   * Requires `data-test-subj="rollupBadge"` on the `EuiBadge` in
   * `index_pattern_table.tsx` (added as part of this migration).
   */
  getRollupBadgeInRow(row: Locator): Locator {
    return row.locator('[data-test-subj="rollupBadge"]');
  }

  /**
   * Clicks the link for a data view by name to open its detail page.
   */
  async clickDataViewByName(name: string): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).click();
    await this.page.testSubj.locator('editIndexPattern').waitFor({ state: 'visible' });
  }

  /**
   * Asserts that a field with the given name is visible on the data view detail page.
   * Prefers a targeted locator assertion over collecting all field names into an array.
   */
  async assertFieldVisible(fieldName: string): Promise<void> {
    await this.page.testSubj
      .locator('editIndexPattern')
      .locator('[data-test-subj="indexedFieldName"]', { hasText: fieldName })
      .waitFor({ state: 'visible' });
  }
}
