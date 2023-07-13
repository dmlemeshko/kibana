/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Journey } from '@kbn/journeys';
import { subj } from '@kbn/test-subj-selector';

export const journey = new Journey({
  // kbnArchives: ['test/functional/fixtures/kbn_archiver/stress_test'],
  // esArchives: ['test/functional/fixtures/es_archiver/stress_test'],
  kbnArchives: ['test/functional/fixtures/kbn_archiver/many_fields_data_view'],
  esArchives: ['test/functional/fixtures/es_archiver/many_fields'],
})
  .step('Go to visualizations listing page', async ({ page, kbnUrl, kibanaServer }) => {
    await kibanaServer.uiSettings.update({ 'histogram:maxBars': 100 });
    await page.goto(kbnUrl.get('/app/visualize#/visualizations'));
    // await page.waitForSelector(subj('table-is-ready'));
  })
  .step('Create new Lens visualization', async ({ page }) => {
    await page.click(subj('newItemButton'));
    await page.click(subj('visType-lens'));
    await page.pause();
  });
