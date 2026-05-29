/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ScoutPage, Locator } from '@kbn/scout';

/**
 * Scout page object for the Rollup Jobs management UI.
 *
 * Covers the create-rollup-job wizard and the job list table.
 *
 * Dropped from the FTR version:
 * - `activateFeature` — dead code; each spec creates its own rollup job.
 * - `verifyIndexPatternAccepted` — RTL-covered (job_create_logistics.test.js:84,145,166,467,490).
 * - All `verifyStepIsActive` calls — RTL-covered; replaced with locator-based waits on step titles.
 */
export class RollupPage {
  /** Top-level header of the Rollup Jobs list page */
  public readonly jobsListTable: Locator;
  /** "Create rollup job" button on the list page */
  public readonly createJobButton: Locator;
  /** Details flyout title that appears after saving a job */
  public readonly detailsFlyoutTitle: Locator;

  constructor(private readonly page: ScoutPage) {
    this.jobsListTable = this.page.testSubj.locator('rollupJobsListTable');
    this.createJobButton = this.page.testSubj.locator('createRollupJobButton');
    this.detailsFlyoutTitle = this.page.testSubj.locator('rollupJobDetailsFlyoutTitle');
  }

  async goto(): Promise<void> {
    await this.page.gotoApp('management/data/rollup_jobs');
    await this.createJobButton.waitFor({ state: 'visible' });
  }

  // ---------------------------------------------------------------------------
  // Wizard navigation helpers
  // ---------------------------------------------------------------------------

  /**
   * Step 1 — Logistics: fill job name, index pattern, rollup index name,
   * schedule, and optional delay, then advance to Step 2.
   *
   * After clicking Next, waits for the Date Histogram step title to confirm
   * the wizard advanced (deterministic readiness signal, replaces the
   * brittle `verifyStepIsActive` assertion that RTL already covers).
   */
  async fillLogisticsStep(params: {
    jobName: string;
    indexPattern: string;
    indexName: string;
    scheduledTime: { time: string; cron: boolean };
    delay?: string;
  }): Promise<void> {
    const { jobName, indexPattern, indexName, scheduledTime, delay = '1d' } = params;

    await this.createJobButton.click();
    await this.page.testSubj.fill('rollupJobName', jobName);
    await this.page.testSubj.fill('rollupIndexPattern', indexPattern);

    // Wait for the index pattern validation success indicator
    await this.page.testSubj
      .locator('fieldIndexPatternSuccessMessage')
      .waitFor({ state: 'visible' });

    await this.page.testSubj.fill('rollupIndexName', indexName);

    if (scheduledTime.cron) {
      await this.page.testSubj.click('rollupShowAdvancedCronLink');
      await this.page.testSubj.fill('rollupAdvancedCron', scheduledTime.time);
    }

    if (delay.trim() !== '') {
      await this.page.testSubj.fill('rollupDelay', delay);
    }

    await this.page.testSubj.click('rollupJobNextButton');
    // Wait for Step 2 (Date Histogram) title to confirm navigation
    await this.page.testSubj
      .locator('rollupJobCreateDateHistogramTitle')
      .waitFor({ state: 'visible' });
  }

  /**
   * Step 2 — Date Histogram: set the interval and advance to Step 3.
   */
  async fillDateHistogramStep(interval: string): Promise<void> {
    await this.page.testSubj.fill('rollupJobInterval', interval);
    await this.page.testSubj.click('rollupJobNextButton');
    // Wait for Step 3 (Terms) title
    await this.page.testSubj.locator('rollupJobCreateTermsTitle').waitFor({ state: 'visible' });
  }

  /**
   * Step 3 — Terms (optional): advance without selecting terms.
   */
  async skipTermsStep(): Promise<void> {
    await this.page.testSubj.click('rollupJobNextButton');
    // Wait for Step 4 (Histogram) title
    await this.page.testSubj.locator('rollupJobCreateHistogramTitle').waitFor({ state: 'visible' });
  }

  /**
   * Step 4 — Histogram (optional): advance without selecting histogram fields.
   */
  async skipHistogramStep(): Promise<void> {
    await this.page.testSubj.click('rollupJobNextButton');
    // Wait for Step 5 (Metrics) title
    await this.page.testSubj.locator('rollupJobCreateMetricsTitle').waitFor({ state: 'visible' });
  }

  /**
   * Step 5 — Metrics (optional): advance without selecting metrics.
   */
  async skipMetricsStep(): Promise<void> {
    await this.page.testSubj.click('rollupJobNextButton');
    // Wait for Step 6 (Review) title
    await this.page.testSubj.locator('rollupJobCreateReviewTitle').waitFor({ state: 'visible' });
  }

  /**
   * Step 6 — Review / Save: optionally start the job immediately, then save.
   *
   * After clicking Save the wizard POSTs to `PUT /api/rollup/jobs/create`.
   * We wait for the details flyout title to confirm the job was created.
   */
  async saveJob(startImmediately = false): Promise<void> {
    if (startImmediately) {
      // Use role-based selector — same pattern as job_create_review.test.js:244
      await this.page.getByRole('checkbox', { name: 'Start job now' }).click();
    }
    await this.page.testSubj.click('rollupJobSaveButton');
    await this.detailsFlyoutTitle.waitFor({ state: 'visible' });
  }

  /**
   * Closes the post-save flyout and waits for the job list table to appear.
   */
  async closeFlyout(): Promise<void> {
    await this.page.testSubj.click('euiFlyoutCloseButton');
    await this.jobsListTable.waitFor({ state: 'visible' });
  }

  // ---------------------------------------------------------------------------
  // Job list helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns all job rows currently visible in the job list table.
   * Each row exposes locators for common cells.
   */
  async getJobRows(): Promise<Locator[]> {
    return this.page.testSubj.locator('jobTableRow').all();
  }

  /**
   * Returns the visible text of the `jobTableCell-id` cell for every row.
   * Use this to assert that a specific job name appears after creation.
   */
  async getJobNames(): Promise<string[]> {
    const rows = await this.getJobRows();
    return Promise.all(
      rows.map(async (row) => {
        const cell = row.locator('[data-test-subj="jobTableCell-id"]');
        return cell.innerText();
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Full wizard shortcut
  // ---------------------------------------------------------------------------

  /**
   * Drives the entire 6-step create-rollup-job wizard:
   * Logistics → Date Histogram → Terms (skip) → Histogram (skip) →
   * Metrics (skip) → Review / Save.
   */
  async createNewRollUpJob(params: {
    jobName: string;
    indexPattern: string;
    indexName: string;
    interval: string;
    delay?: string;
    startImmediately?: boolean;
    scheduledTime?: { time: string; cron: boolean };
  }): Promise<void> {
    const {
      jobName,
      indexPattern,
      indexName,
      interval,
      delay = '1d',
      startImmediately = false,
      scheduledTime = { time: 'minute', cron: false },
    } = params;

    await this.fillLogisticsStep({ jobName, indexPattern, indexName, scheduledTime, delay });
    await this.fillDateHistogramStep(interval);
    await this.skipTermsStep();
    await this.skipHistogramStep();
    await this.skipMetricsStep();
    await this.saveJob(startImmediately);
  }
}
