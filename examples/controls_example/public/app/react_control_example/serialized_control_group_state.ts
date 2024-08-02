/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { SerializedPanelState } from '@kbn/presentation-containers';
import { ControlGroupSerializedState } from '../../react_controls/control_group/types';
import { OPTIONS_LIST_CONTROL_TYPE } from '../../react_controls/data_controls/options_list_control/constants';
import { RANGE_SLIDER_CONTROL_TYPE } from '../../react_controls/data_controls/range_slider/types';
import { SEARCH_CONTROL_TYPE } from '../../react_controls/data_controls/search_control/types';
import { TIMESLIDER_CONTROL_TYPE } from '../../react_controls/timeslider_control/types';

const SERIALIZED_STATE_SESSION_STORAGE_KEY =
  'kibana.examples.controls.reactControlExample.controlGroupSerializedState';
export const WEB_LOGS_DATA_VIEW_ID = '90943e30-9a47-11e8-b64d-95841ca0b247';

export function clearControlGroupSerializedState() {
  sessionStorage.removeItem(SERIALIZED_STATE_SESSION_STORAGE_KEY);
}

export function getControlGroupSerializedState(): SerializedPanelState<ControlGroupSerializedState> {
  const serializedStateJSON = sessionStorage.getItem(SERIALIZED_STATE_SESSION_STORAGE_KEY);
  return serializedStateJSON ? JSON.parse(serializedStateJSON) : initialSerializedControlGroupState;
}

export function setControlGroupSerializedState(
  serializedState: SerializedPanelState<ControlGroupSerializedState>
) {
  sessionStorage.setItem(SERIALIZED_STATE_SESSION_STORAGE_KEY, JSON.stringify(serializedState));
}

const optionsListId = 'optionsList1';
const searchControlId = 'searchControl1';
const rangeSliderControlId = 'rangeSliderControl1';
const timesliderControlId = 'timesliderControl1';
const controlGroupPanels = {
  [searchControlId]: {
    type: SEARCH_CONTROL_TYPE,
    order: 3,
    grow: true,
    width: 'medium',
    explicitInput: {
      id: searchControlId,
      fieldName: 'message',
      title: 'Message',
      grow: true,
      width: 'medium',
      enhancements: {},
    },
  },
  [rangeSliderControlId]: {
    type: RANGE_SLIDER_CONTROL_TYPE,
    order: 1,
    grow: true,
    width: 'medium',
    explicitInput: {
      id: rangeSliderControlId,
      fieldName: 'bytes',
      title: 'Bytes',
      grow: true,
      width: 'medium',
      enhancements: {},
    },
  },
  [timesliderControlId]: {
    type: TIMESLIDER_CONTROL_TYPE,
    order: 4,
    grow: true,
    width: 'medium',
    explicitInput: {
      id: timesliderControlId,
      title: 'Time slider',
      enhancements: {},
    },
  },
  [optionsListId]: {
    type: OPTIONS_LIST_CONTROL_TYPE,
    order: 2,
    grow: true,
    width: 'medium',
    explicitInput: {
      id: searchControlId,
      fieldName: 'agent.keyword',
      title: 'Agent',
      grow: true,
      width: 'medium',
      enhancements: {},
    },
  },
};

const initialSerializedControlGroupState = {
  rawState: {
    controlStyle: 'oneLine',
    chainingSystem: 'HIERARCHICAL',
    showApplySelections: false,
    panelsJSON: JSON.stringify(controlGroupPanels),
    ignoreParentSettingsJSON:
      '{"ignoreFilters":false,"ignoreQuery":false,"ignoreTimerange":false,"ignoreValidations":false}',
  } as object,
  references: [
    {
      name: `controlGroup_${searchControlId}:${SEARCH_CONTROL_TYPE}DataView`,
      type: 'index-pattern',
      id: WEB_LOGS_DATA_VIEW_ID,
    },
    {
      name: `controlGroup_${rangeSliderControlId}:${RANGE_SLIDER_CONTROL_TYPE}DataView`,
      type: 'index-pattern',
      id: WEB_LOGS_DATA_VIEW_ID,
    },
    {
      name: `controlGroup_${optionsListId}:optionsListControlDataView`,
      type: 'index-pattern',
      id: WEB_LOGS_DATA_VIEW_ID,
    },
  ],
};
