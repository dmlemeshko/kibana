/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { FieldFormatsStart } from '@kbn/field-formats-plugin/public';
import { ES_FIELD_TYPES, KBN_FIELD_TYPES } from '@kbn/field-types';
import {
  flyoutDatasetCreatedOnText,
  flyoutDatasetDetailsText,
  flyoutDatasetLastActivityText,
} from '../../../common/translations';
import { DataStreamStat, DataStreamDetails } from '../../../common/data_streams_stats';
import { FieldsList, FieldsListLoading } from './fields_list';

interface DatasetSummaryProps {
  fieldFormats: FieldFormatsStart;
  dataStreamDetails?: DataStreamDetails;
  dataStreamStat: DataStreamStat;
}

export function DatasetSummary({
  dataStreamStat,
  dataStreamDetails,
  fieldFormats,
}: DatasetSummaryProps) {
  const dataFormatter = fieldFormats.getDefaultInstance(KBN_FIELD_TYPES.DATE, [
    ES_FIELD_TYPES.DATE,
  ]);
  const formattedLastActivity = dataFormatter.convert(dataStreamStat.lastActivity);
  const formattedCreatedOn = dataStreamDetails?.createdOn
    ? dataFormatter.convert(dataStreamDetails.createdOn)
    : '-';

  return (
    <FieldsList
      title={flyoutDatasetDetailsText}
      fields={[
        {
          fieldTitle: flyoutDatasetLastActivityText,
          fieldValue: formattedLastActivity,
        },
        {
          fieldTitle: flyoutDatasetCreatedOnText,
          fieldValue: formattedCreatedOn,
        },
      ]}
    />
  );
}

export function DatasetSummaryLoading() {
  return <FieldsListLoading />;
}
