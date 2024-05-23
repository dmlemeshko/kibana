/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Path from 'path';

import { REPO_ROOT } from '@kbn/repo-info';
import type { FtrConfigProviderContext, FtrConfigProvider } from '../../../..';

export function loadDefaultConfigProvider(
  testFileResolvedPath: string,
  ftrConfigPath: string
): FtrConfigProvider {
  return async ({ readConfigFile }: FtrConfigProviderContext) => {
    const config = (await readConfigFile(Path.resolve(REPO_ROOT, ftrConfigPath))).getAll();

    return {
      ...config,
      testFiles: [testFileResolvedPath],
    };
  };
}
