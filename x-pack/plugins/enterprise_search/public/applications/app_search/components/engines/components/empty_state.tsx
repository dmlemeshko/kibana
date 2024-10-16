/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { useValues, useActions } from 'kea';

import { EuiEmptyPrompt, EuiSpacer } from '@elastic/eui';
import { i18n } from '@kbn/i18n';

import { EnterpriseSearchDeprecationCallout } from '../../../../shared/deprecation_callout/deprecation_callout';
import { EuiButtonTo } from '../../../../shared/react_router_helpers';
import { TelemetryLogic } from '../../../../shared/telemetry';
import { AppLogic } from '../../../app_logic';
import { EngineIcon } from '../../../icons';
import { ENGINE_CREATION_PATH } from '../../../routes';

import { SampleEngineCreationCta } from '../../sample_engine_creation_cta/sample_engine_creation_cta';

export const EmptyState: React.FC = () => {
  const {
    myRole: { canManageEngines },
  } = useValues(AppLogic);
  const { sendAppSearchTelemetry } = useActions(TelemetryLogic);

  const [showDeprecationCallout, setShowDeprecationCallout] = React.useState(
    !sessionStorage.getItem('appSearchHideDeprecationCallout')
  );

  const onDismissDeprecationCallout = () => {
    setShowDeprecationCallout(false);
    sessionStorage.setItem('appSearchHideDeprecationCallout', 'true');
  };

  return (
    <>
      {showDeprecationCallout ? (
        <EnterpriseSearchDeprecationCallout
          onDismissAction={onDismissDeprecationCallout}
          restrictWidth
        />
      ) : (
        <></>
      )}
      {canManageEngines ? (
        <EuiEmptyPrompt
          data-test-subj="AdminEmptyEnginesPrompt"
          iconType={EngineIcon}
          title={
            <h2>
              {i18n.translate('xpack.enterpriseSearch.appSearch.emptyState.title', {
                defaultMessage: 'Create your first engine',
              })}
            </h2>
          }
          titleSize="l"
          body={
            <p>
              {i18n.translate('xpack.enterpriseSearch.appSearch.emptyState.description1', {
                defaultMessage:
                  'An App Search engine stores the documents for your search experience.',
              })}
            </p>
          }
          actions={
            <>
              <EuiButtonTo
                data-test-subj="EmptyStateCreateFirstEngineCta"
                fill
                to={ENGINE_CREATION_PATH}
                onClick={() =>
                  sendAppSearchTelemetry({
                    action: 'clicked',
                    metric: 'create_first_engine_button',
                  })
                }
              >
                {i18n.translate(
                  'xpack.enterpriseSearch.appSearch.emptyState.createFirstEngineCta',
                  {
                    defaultMessage: 'Create an engine',
                  }
                )}
              </EuiButtonTo>
              <EuiSpacer size="xxl" />
              <SampleEngineCreationCta />
            </>
          }
        />
      ) : (
        <EuiEmptyPrompt
          data-test-subj="NonAdminEmptyEnginesPrompt"
          iconType={EngineIcon}
          title={
            <h2>
              {i18n.translate('xpack.enterpriseSearch.appSearch.emptyState.nonAdmin.title', {
                defaultMessage: 'No engines available',
              })}
            </h2>
          }
          body={
            <p>
              {i18n.translate('xpack.enterpriseSearch.appSearch.emptyState.nonAdmin.description', {
                defaultMessage:
                  'Contact your App Search administrator to either create or grant you access to an engine.',
              })}
            </p>
          }
        />
      )}
    </>
  );
};
