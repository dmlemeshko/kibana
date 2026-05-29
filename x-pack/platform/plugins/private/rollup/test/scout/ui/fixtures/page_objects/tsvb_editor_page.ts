/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ScoutPage, Locator } from '@kbn/scout';
import { EuiComboBoxWrapper } from '@kbn/scout';

/**
 * Scout page object for the TSVB (Time Series Visual Builder) editor.
 *
 * Plugin-local: covers only the methods needed by `tsvb_rollup.spec.ts`.
 *
 * Derived from `src/platform/test/functional/page_objects/visual_builder_page.ts`.
 * Relevant methods: `clickMetric`, `checkMetricTabIsPresent`, `clickPanelOptions`,
 * `setIndexPatternValue`, `selectIndexPatternTimeField`, `setMetricsDataTimerangeMode`,
 * `setIntervalValue`, `setDropLastBucket`, `getMetricValue`.
 *
 * Promotion note: these methods are reusable beyond rollup.  Consider promoting
 * to `kbn-scout` or the `vis_types/timeseries` Scout package in a follow-up.
 * Coordinate with @elastic/kibana-visualizations for the right landing spot.
 */
export class TsvbEditorPage {
  /** Container for the TSVB editor canvas */
  public readonly editorContainer: Locator;
  /** Primary metric value element rendered by the metric visualization */
  public readonly metricValue: Locator;

  private readonly timeRangeComboBox: EuiComboBoxWrapper;
  private readonly timeFieldComboBox: EuiComboBoxWrapper;

  constructor(private readonly page: ScoutPage) {
    this.editorContainer = this.page.testSubj.locator('tvbVisEditor');
    this.metricValue = this.page.locator('.tvbVisMetric__value--primary');
    this.timeRangeComboBox = new EuiComboBoxWrapper(
      this.page.testSubj.locator('dataTimeRangeMode')
    );
    this.timeFieldComboBox = new EuiComboBoxWrapper(
      this.page.testSubj.locator('metricsIndexPatternFieldsSelect')
    );
  }

  /** Wait for the TSVB editor to be present after creation. */
  async waitForEditorReady(): Promise<void> {
    await this.editorContainer.waitFor({ state: 'visible' });
  }

  // ---------------------------------------------------------------------------
  // Visualization type tabs
  // ---------------------------------------------------------------------------

  /**
   * Click the Metric visualization type button and wait for the metric canvas
   * to appear.  Corresponds to FTR's `clickMetric()` + `checkMetricTabIsPresent()`.
   */
  async clickMetricType(): Promise<void> {
    await this.page.testSubj.click('metricTsvbTypeBtn');
    await this.page.testSubj.locator('tsvbMetricValue').waitFor({ state: 'visible' });
  }

  // ---------------------------------------------------------------------------
  // Panel options tab
  // ---------------------------------------------------------------------------

  /**
   * Click the Panel Options tab for the given visualization type.
   * For `metric` this clicks `metricEditorPanelOptionsBtn`.
   */
  async clickPanelOptions(visType: string): Promise<void> {
    const testSubj = `${visType}EditorPanelOptionsBtn`;
    await this.page.testSubj.click(testSubj);
    // Wait for the tab to become selected
    await this.page.waitFor(async () => {
      const selected = await this.page.testSubj.locator(testSubj).getAttribute('aria-selected');
      return selected === 'true';
    });
  }

  // ---------------------------------------------------------------------------
  // Index pattern settings
  // ---------------------------------------------------------------------------

  /**
   * Switch the index pattern input to "raw indices" mode (not a Kibana data view)
   * and type the index name into the text field.
   *
   * Corresponds to FTR's `setIndexPatternValue(value, false)`.
   */
  async setRawIndexPattern(indexName: string): Promise<void> {
    // Open the selection mode popover
    await this.page.testSubj.click('switchIndexPatternSelectionModePopoverButton');
    await this.page.testSubj
      .locator('switchIndexPatternSelectionModePopoverContent')
      .waitFor({ state: 'visible' });

    // Switch to "raw indices" mode if not already there
    const switchEl = this.page.testSubj.locator('switchIndexPatternSelectionMode');
    const isChecked = await switchEl.getAttribute('aria-checked');
    if (isChecked === 'true') {
      await switchEl.click();
    }

    // Close the popover
    await this.page.testSubj.click('switchIndexPatternSelectionModePopoverButton');
    await this.page.testSubj
      .locator('switchIndexPatternSelectionModePopoverContent')
      .waitFor({ state: 'hidden' });

    // Fill the raw index pattern text input and wait for the value to be set.
    const input = this.page.testSubj.locator('metricsIndexPatternInput');
    await input.clear();
    await input.fill(indexName);
    await input.blur();
  }

  /**
   * Select the time field from the time-field combobox in Panel Options.
   * Corresponds to FTR's `selectIndexPatternTimeField(timeField)`.
   */
  async selectTimeField(timeField: string): Promise<void> {
    await this.timeFieldComboBox.selectOption(timeField);
  }

  // ---------------------------------------------------------------------------
  // Data range / interval settings
  // ---------------------------------------------------------------------------

  /**
   * Set the "Data timerange mode" dropdown.
   * Corresponds to FTR's `setMetricsDataTimerangeMode(value)`.
   * Common values: `'Last value'`, `'Entire time range'`.
   */
  async setDataTimerangeMode(value: string): Promise<void> {
    await this.timeRangeComboBox.selectOption(value);
  }

  /**
   * Set the bucket interval text field.
   * Corresponds to FTR's `setIntervalValue(value)`.
   */
  async setInterval(value: string): Promise<void> {
    const el = this.page.testSubj.locator('metricsIndexPatternInterval');
    await el.clear();
    await el.fill(value);
  }

  /**
   * Set the "Drop last bucket" toggle.
   * `false` → clicks the "No" label (corresponds to FTR's `setDropLastBucket(false)`).
   */
  async setDropLastBucket(value: boolean): Promise<void> {
    const testSubj = `metricsDropLastBucket-${value ? 'yes' : 'no'}`;
    await this.page.testSubj.locator(testSubj).locator('label').click();
  }

  // ---------------------------------------------------------------------------
  // Value assertions
  // ---------------------------------------------------------------------------

  /**
   * Returns the primary metric value text once the visualization has rendered.
   * Replaces FTR's `sleep(3000) + getMetricValue()` with a Playwright text wait.
   * Use `expect(tsvbEditor.metricValue).toHaveText('3', { timeout: 30_000 })`
   * in the spec for a polling assertion.
   */
  async getMetricValue(): Promise<string> {
    return (await this.metricValue.innerText()).trim();
  }
}
