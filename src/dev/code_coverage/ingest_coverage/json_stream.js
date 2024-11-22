/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { createReadStream } from 'fs';

export default (jsonSummaryPath) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = createReadStream(jsonSummaryPath, { encoding: 'utf8' });

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      try {
        const json = JSON.parse(chunks.join(''));
        resolve(json);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error.message}`));
      }
    });

    stream.on('error', (error) => {
      reject(new Error(`Failed to read file: ${error.message}`));
    });
  });
};
