/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PageObjects, ScoutPage } from '@kbn/scout';
import { createLazyPageObject } from '@kbn/scout';
import { ClusterListPage } from './cluster_list_page';
import { ClusterOverviewPage } from './cluster_overview_page';
import { ElasticsearchNodesPage } from './elasticsearch_nodes_page';
import { ElasticsearchIndicesPage } from './elasticsearch_indices_page';

export type { ClusterListPage, ClusterOverviewPage, ElasticsearchNodesPage, ElasticsearchIndicesPage };

export interface MonitoringPageObjects extends PageObjects {
  clusterList: ClusterListPage;
  clusterOverview: ClusterOverviewPage;
  esNodes: ElasticsearchNodesPage;
  esIndices: ElasticsearchIndicesPage;
}

export const extendPageObjects = (
  pageObjects: PageObjects,
  page: ScoutPage
): MonitoringPageObjects => ({
  ...pageObjects,
  clusterList: createLazyPageObject(ClusterListPage, page),
  clusterOverview: createLazyPageObject(ClusterOverviewPage, page),
  esNodes: createLazyPageObject(ElasticsearchNodesPage, page),
  esIndices: createLazyPageObject(ElasticsearchIndicesPage, page),
});
