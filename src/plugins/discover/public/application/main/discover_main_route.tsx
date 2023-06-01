/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import type { DataView } from '@kbn/data-views-plugin/public';
import { redirectWhenMissing, SavedObjectNotFound } from '@kbn/kibana-utils-plugin/public';
import { useExecutionContext } from '@kbn/kibana-react-plugin/public';
import {
  AnalyticsNoDataPageKibanaProvider,
  AnalyticsNoDataPage,
} from '@kbn/shared-ux-page-analytics-no-data';
import { getSavedSearchFullPathUrl } from '@kbn/saved-search-plugin/public';
import useObservable from 'react-use/lib/useObservable';
import { reportPerformanceMetricEvent } from '@kbn/ebt-tools';
import { useUrl } from './hooks/use_url';
import { useSingleton } from './hooks/use_singleton';
import { MainHistoryLocationState } from '../../../common/locator';
import { DiscoverStateContainer, getDiscoverStateContainer } from './services/discover_state';
import { DiscoverMainApp } from './discover_main_app';
import { getRootBreadcrumbs, getSavedSearchBreadcrumbs } from '../../utils/breadcrumbs';
import { LoadingIndicator } from '../../components/common/loading_indicator';
import { DiscoverError } from '../../components/common/error_alert';
import { useDiscoverServices } from '../../hooks/use_discover_services';
import { getScopedHistory, getUrlTracker } from '../../kibana_services';
import { useAlertResultsToast } from './hooks/use_alert_results_toast';
import { DiscoverMainProvider } from './services/discover_state_provider';

const DiscoverMainAppMemoized = memo(DiscoverMainApp);

interface DiscoverLandingParams {
  id: string;
}

interface Props {
  isDev: boolean;
}

export function DiscoverMainRoute(props: Props) {
  const history = useHistory();
  const services = useDiscoverServices();
  const { isDev } = props;
  const {
    core,
    chrome,
    data,
    toastNotifications,
    http: { basePath },
    dataViewEditor,
  } = services;
  const { id: savedSearchId } = useParams<DiscoverLandingParams>();
  const stateContainer = useSingleton<DiscoverStateContainer>(() =>
    getDiscoverStateContainer({
      history,
      services,
    })
  );
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [hasESData, setHasESData] = useState(false);
  const [hasUserDataView, setHasUserDataView] = useState(false);
  const [showNoDataPage, setShowNoDataPage] = useState<boolean>(false);
  const hasCustomBranding = useObservable(core.customBranding.hasCustomBranding$, false);

  /**
   * Get location state of scoped history only on initial load
   */
  const historyLocationState = useMemo(
    () => getScopedHistory().location.state as MainHistoryLocationState | undefined,
    []
  );

  useAlertResultsToast({
    isAlertResults: historyLocationState?.isAlertResults,
    toastNotifications,
  });

  useExecutionContext(core.executionContext, {
    type: 'application',
    page: 'app',
    id: savedSearchId || 'new',
  });

  const checkData = useCallback(async () => {
    try {
      const checkDataStartTime = window.performance.now();
      const hasUserDataViewValue = await data.dataViews.hasData
        .hasUserDataView()
        .catch(() => false);
      const hasESDataValue = isDev || (await data.dataViews.hasData.hasESData().catch(() => false));
      setHasUserDataView(hasUserDataViewValue);
      setHasESData(hasESDataValue);

      if (!hasUserDataViewValue) {
        setShowNoDataPage(true);
        return false;
      }

      let defaultDataView: DataView | null = null;
      try {
        defaultDataView = await data.dataViews.getDefaultDataView({ displayErrors: false });
      } catch (e) {
        //
      }

      const checkDataDuration = window.performance.now() - checkDataStartTime;
      reportPerformanceMetricEvent(services.analytics, {
        eventName: 'discoverCheckData',
        duration: checkDataDuration,
      });

      if (!defaultDataView) {
        setShowNoDataPage(true);
        return false;
      }
      return true;
    } catch (e) {
      setError(e);
      return false;
    }
  }, [data.dataViews, isDev, services.analytics]);

  const loadSavedSearch = useCallback(
    async (nextDataView?: DataView) => {
      const loadSavedSearchStartTime = window.performance.now();
      setLoading(true);
      if (!nextDataView && !(await checkData())) {
        setLoading(false);
        return;
      }
      try {
        await stateContainer.actions.loadDataViewList();
        // reset appState in case a saved search with id is loaded and the url is empty
        // so the saved search is loaded in a clean state
        // else it might be updated by the previous app state
        const useAppState = !stateContainer.appState.isEmptyURL();
        const currentSavedSearch = await stateContainer.actions.loadSavedSearch({
          savedSearchId,
          dataView: nextDataView,
          dataViewSpec: historyLocationState?.dataViewSpec,
          useAppState,
        });
        if (currentSavedSearch?.id) {
          chrome.recentlyAccessed.add(
            getSavedSearchFullPathUrl(currentSavedSearch.id),
            currentSavedSearch.title ?? '',
            currentSavedSearch.id
          );
        }

        chrome.setBreadcrumbs(
          currentSavedSearch && currentSavedSearch.title
            ? getSavedSearchBreadcrumbs(currentSavedSearch.title)
            : getRootBreadcrumbs()
        );

        setLoading(false);
        const loadSavedSearchDuration = window.performance.now() - loadSavedSearchStartTime;
        reportPerformanceMetricEvent(services.analytics, {
          eventName: 'discoverLoadSavedSearch',
          duration: loadSavedSearchDuration,
        });
      } catch (e) {
        if (e instanceof SavedObjectNotFound) {
          redirectWhenMissing({
            history,
            navigateToApp: core.application.navigateToApp,
            basePath,
            mapping: {
              search: '/',
              'index-pattern': {
                app: 'management',
                path: `kibana/objects/savedSearches/${savedSearchId}`,
              },
            },
            toastNotifications,
            onBeforeRedirect() {
              getUrlTracker().setTrackedUrl('/');
            },
            theme: core.theme,
          })(e);
        } else {
          setError(e);
        }
      }
    },
    [
      checkData,
      stateContainer.actions,
      stateContainer.appState,
      savedSearchId,
      historyLocationState?.dataViewSpec,
      chrome,
      services.analytics,
      history,
      core.application.navigateToApp,
      core.theme,
      basePath,
      toastNotifications,
    ]
  );

  const onDataViewCreated = useCallback(
    async (nextDataView: unknown) => {
      const dataViewCreatedStartTime = window.performance.now();
      if (nextDataView) {
        setLoading(true);
        setShowNoDataPage(false);
        setError(undefined);
        await loadSavedSearch(nextDataView as DataView);
      }
      const dataViewCreatedEndTime = window.performance.now();
      const dataViewCreatedDuration = dataViewCreatedEndTime - dataViewCreatedStartTime;
      window.console.log(`dataViewCreatedDuration=${dataViewCreatedDuration}`);
    },
    [loadSavedSearch]
  );

  // primary fetch: on initial search + triggered when id changes
  useEffect(() => {
    // restore the previously selected data view for a new state
    loadSavedSearch(!savedSearchId ? stateContainer.internalState.getState().dataView : undefined);
  }, [loadSavedSearch, savedSearchId, stateContainer]);

  // secondary fetch: in case URL is set to `/`, used to reset to 'new' state, keeping the current data view
  useUrl({
    history,
    savedSearchId,
    onNewUrl: () => {
      // restore the previously selected data view for a new state
      const dataView = stateContainer.internalState.getState().dataView;
      loadSavedSearch(dataView);
    },
  });

  if (showNoDataPage) {
    const analyticsServices = {
      coreStart: core,
      dataViews: {
        ...data.dataViews,
        hasData: {
          ...data.dataViews.hasData,

          // We've already called this, so we can optimize the analytics services to
          // use the already-retrieved data to avoid a double-call.
          hasESData: () => Promise.resolve(isDev ? true : hasESData),
          hasUserDataView: () => Promise.resolve(hasUserDataView),
        },
      },
      dataViewEditor,
    };

    return (
      <AnalyticsNoDataPageKibanaProvider {...analyticsServices}>
        <AnalyticsNoDataPage onDataViewCreated={onDataViewCreated} allowAdHocDataView />
      </AnalyticsNoDataPageKibanaProvider>
    );
  }

  if (error) {
    return <DiscoverError error={error} />;
  }

  if (loading) {
    return <LoadingIndicator type={hasCustomBranding ? 'spinner' : 'elastic'} />;
  }

  return (
    <DiscoverMainProvider value={stateContainer}>
      <DiscoverMainAppMemoized stateContainer={stateContainer} />
    </DiscoverMainProvider>
  );
}
