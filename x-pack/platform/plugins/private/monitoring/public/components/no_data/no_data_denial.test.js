/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Migrated from:
 *   x-pack/platform/test/functional/apps/monitoring/feature_controls/monitoring_security.ts
 *   (monitoring_user + kibana_admin → no-data page → click "set up with self monitoring"
 *    → weTriedContainer — test #8 from the migration plan)
 *
 * The FTR test required a fresh cluster (no monitoring data) and a browser login flow.
 * This RTL test isolates the same UI state by rendering `<NoData>` with props that
 * produce the empty-data path, then clicking the "set up with self monitoring" button
 * and asserting `weTriedContainer` becomes visible.
 *
 * Component logic: clicking `data-test-subj="useInternalCollection"` sets local state
 * `useInternalCollection = true`. When that flag is true and `!reason && !isLoading &&
 * !isCollectionEnabledUpdated`, `NoDataMessage` falls through to `<WeTried />`.
 */

import React from 'react';
import { renderWithI18nProvider } from '@kbn/test-jest-helpers';
import { fireEvent, screen } from '@testing-library/react';
import { NoData } from '.';

jest.mock('../../legacy_shims', () => ({
  Legacy: {
    shims: {
      isAirGapped: false,
      useCloudConnectStatus: () => ({ isCloudConnectAutoopsEnabled: false, isLoading: false }),
    },
  },
}));

jest.mock('@kbn/kibana-react-plugin/public', () => ({
  useKibana: () => ({
    services: {
      application: {
        getUrlForApp: jest.fn(() => '/app/cloud_connect'),
        navigateToApp: jest.fn(),
        capabilities: {
          cloudConnect: {
            show: false,
            configure: false,
          },
        },
      },
      notifications: {
        tours: {
          isEnabled: jest.fn(() => false),
        },
      },
    },
  }),
}));

// Suppress toggleSetupMode which hits backend
jest.mock('../../lib/setup_mode', () => ({
  toggleSetupMode: jest.fn().mockResolvedValue(undefined),
}));

describe('NoData — denial flow (monitoring_user + kibana_admin scenario)', () => {
  test('clicking "set up with self monitoring" shows weTriedContainer when no data is available', async () => {
    renderWithI18nProvider(
      <NoData
        isLoading={false}
        isCollectionEnabledUpdated={false}
        enabler={{}}
      />
    );

    // The "set up with self monitoring" button must be present
    const selfMonitoringBtn = screen.getByTestId('useInternalCollection');
    expect(selfMonitoringBtn).toBeDefined();

    // Click it — this sets useInternalCollection = true inside NoData
    fireEvent.click(selfMonitoringBtn);

    // With useInternalCollection=true and no reason/loading, NoDataMessage renders WeTried
    const weTriedContainer = screen.getByTestId('weTriedContainer');
    expect(weTriedContainer).toBeDefined();
  });
});
