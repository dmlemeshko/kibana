/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useCallback } from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useExpandableFlyoutApi } from '@kbn/expandable-flyout';
import { OPEN_FLYOUT_BUTTON_TEST_ID } from './test_ids';
import { useSourcererDataView } from '../../sourcerer/containers';
import { SourcererScopeName } from '../../sourcerer/store/model';
import { useKibana } from '../../common/lib/kibana';
import { DocumentDetailsRightPanelKey } from '../../flyout/document_details/shared/constants/panel_keys';

export const OPEN_FLYOUT_BUTTON = i18n.translate(
  'xpack.securitySolution.notes.openFlyoutButtonLabel',
  {
    defaultMessage: 'Expand event details',
  }
);

export interface OpenFlyoutButtonIconProps {
  /**
   * Id of the event to render in the flyout
   */
  eventId: string;
  /**
   * Id of the timeline to pass to the flyout for scope
   */
  timelineId: string;
}

/**
 * Renders a button to open the alert and event details flyout
 */
export const OpenFlyoutButtonIcon = memo(({ eventId, timelineId }: OpenFlyoutButtonIconProps) => {
  const { selectedPatterns } = useSourcererDataView(SourcererScopeName.timeline);

  const { telemetry } = useKibana().services;
  const { openFlyout } = useExpandableFlyoutApi();

  const handleClick = useCallback(() => {
    openFlyout({
      right: {
        id: DocumentDetailsRightPanelKey,
        params: {
          id: eventId,
          indexName: selectedPatterns.join(','),
          scopeId: timelineId,
        },
      },
    });
    telemetry.reportDetailsFlyoutOpened({
      location: timelineId,
      panel: 'right',
    });
  }, [eventId, openFlyout, selectedPatterns, telemetry, timelineId]);

  return (
    <EuiButtonIcon
      data-test-subj={OPEN_FLYOUT_BUTTON_TEST_ID}
      title={OPEN_FLYOUT_BUTTON}
      aria-label={OPEN_FLYOUT_BUTTON}
      color="text"
      iconType="arrowRight"
      onClick={handleClick}
    />
  );
});

OpenFlyoutButtonIcon.displayName = 'OpenFlyoutButtonIcon';
