/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook } from '@testing-library/react-hooks';

import { mockDataFormattedForFieldBrowser } from '../mocks/mock_data_formatted_for_field_browser';
import { useHighlightedFields } from './use_highlighted_fields';
import { SENTINEL_ONE_AGENT_ID_FIELD } from '../../../../common/utils/sentinelone_alert_check';

const dataFormattedForFieldBrowser = mockDataFormattedForFieldBrowser;

describe('useHighlightedFields', () => {
  it('should return data', () => {
    const hookResult = renderHook(() => useHighlightedFields({ dataFormattedForFieldBrowser }));
    expect(hookResult.result.current).toEqual({
      'kibana.alert.rule.type': {
        values: ['query'],
      },
    });
  });

  it('should omit endpoint agent id field if data is not s1 alert', () => {
    const hookResult = renderHook(() =>
      useHighlightedFields({
        dataFormattedForFieldBrowser: dataFormattedForFieldBrowser.concat({
          category: 'agent',
          field: 'agent.id',
          values: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
          originalValue: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
          isObjectArray: false,
        }),
        investigationFields: ['agent.status', 'agent.id'],
      })
    );

    expect(hookResult.result.current).toEqual({
      'kibana.alert.rule.type': {
        values: ['query'],
      },
    });
  });

  it('should return endpoint agent id field if data is s1 alert', () => {
    const hookResult = renderHook(() =>
      useHighlightedFields({
        dataFormattedForFieldBrowser: dataFormattedForFieldBrowser.concat([
          {
            category: 'agent',
            field: 'agent.type',
            values: ['endpoint'],
            originalValue: ['endpoint'],
            isObjectArray: false,
          },
          {
            category: 'agent',
            field: 'agent.id',
            values: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
            originalValue: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
            isObjectArray: false,
          },
        ]),
        investigationFields: ['agent.status', 'agent.id'],
      })
    );

    expect(hookResult.result.current).toEqual({
      'kibana.alert.rule.type': {
        values: ['query'],
      },
      'agent.id': {
        values: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
      },
    });
  });

  it('should omit sentinelone agent id field if data is not s1 alert', () => {
    const hookResult = renderHook(() =>
      useHighlightedFields({
        dataFormattedForFieldBrowser: dataFormattedForFieldBrowser.concat({
          category: 'observer',
          field: `observer.${SENTINEL_ONE_AGENT_ID_FIELD}`,
          values: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
          originalValue: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
          isObjectArray: false,
        }),
        investigationFields: ['agent.status', 'observer.serial_number'],
      })
    );

    expect(hookResult.result.current).toEqual({
      'kibana.alert.rule.type': {
        values: ['query'],
      },
    });
  });

  it('should return sentinelone agent id field if data is s1 alert', () => {
    const hookResult = renderHook(() =>
      useHighlightedFields({
        dataFormattedForFieldBrowser: dataFormattedForFieldBrowser.concat([
          {
            category: 'event',
            field: 'event.module',
            values: ['sentinel_one'],
            originalValue: ['sentinel_one'],
            isObjectArray: false,
          },
          {
            category: 'observer',
            field: SENTINEL_ONE_AGENT_ID_FIELD,
            values: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
            originalValue: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
            isObjectArray: false,
          },
        ]),
        investigationFields: ['agent.status', 'observer.serial_number'],
      })
    );

    expect(hookResult.result.current).toEqual({
      'kibana.alert.rule.type': {
        values: ['query'],
      },
      'observer.serial_number': {
        values: ['deb35a20-70f8-458e-a64a-c9e6f7575893'],
      },
    });
  });
});
