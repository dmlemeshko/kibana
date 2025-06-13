/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SvlCommonPageProvider } from '@kbn/test-suites-serverless/functional/page_objects/svl_common_page';
import { pageObjects as xpackFunctionalPageObjects } from '@kbn/test-suites-xpack/functional/page_objects';
import { DetectionsPageObject } from '@kbn/test-suites-xpack/security_solution_ftr/page_objects/detections';
import { HostsPageObject } from '@kbn/test-suites-xpack/security_solution_ftr/page_objects/hosts';
import { TimelinePageObject } from '@kbn/test-suites-xpack/security_solution_ftr/page_objects/timeline';
import { EndpointPageProvider } from './endpoint_page';
import { EndpointPageUtils } from './page_utils';
import { IngestManagerCreatePackagePolicy } from './ingest_manager_create_package_policy_page';
import { EndpointResponderPageObjects } from './endpoint_responder';
import { EndpointPolicyPageProvider } from './policy_page';
import { TrustedAppsPageProvider } from './trusted_apps_page';
import { FleetIntegrations } from './fleet_integrations_page';
import { ArtifactEntriesListPageProvider } from './artifact_entries_list_page';

export const pageObjects = {
  ...xpackFunctionalPageObjects,

  endpoint: EndpointPageProvider,
  endpointPageUtils: EndpointPageUtils,
  ingestManagerCreatePackagePolicy: IngestManagerCreatePackagePolicy,
  detections: DetectionsPageObject,
  timeline: TimelinePageObject,
  hosts: HostsPageObject,
  responder: EndpointResponderPageObjects,
  policy: EndpointPolicyPageProvider,
  trustedApps: TrustedAppsPageProvider,
  artifactEntriesList: ArtifactEntriesListPageProvider,
  fleetIntegrations: FleetIntegrations,
};

export const svlPageObjects = {
  ...pageObjects,

  svlCommonPage: SvlCommonPageProvider,
};

export type PageObjects = typeof pageObjects | typeof svlPageObjects;
