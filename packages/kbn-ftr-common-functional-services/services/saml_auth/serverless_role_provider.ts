/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ServerlessProjectType, SERVERLESS_ROLES_ROOT_PATH } from '@kbn/es';
import { type Config } from '@kbn/test';
import { isServerlessProjectType, readRolesDescriptorsFromResource } from '@kbn/es/src/utils';
import { resolve } from 'path';
import { Role } from '@kbn/test/src/auth/types';
import { AuthRoleProvider } from './auth_role_provider';
import { getServerlessInternalRequestHeaders, COMMON_REQUEST_HEADERS } from './internal_headers';

const projectDefaultRoles = new Map<string, Role>([
  ['es', 'developer'],
  ['security', 'editor'],
  ['oblt', 'editor'],
]);

const getDefaultServerlessRole = (projectType: string) => {
  if (projectDefaultRoles.has(projectType)) {
    return projectDefaultRoles.get(projectType)!;
  } else {
    throw new Error(`Default role is not defined for ${projectType} project`);
  }
};

export class ServerlessAuthRoleProvider implements AuthRoleProvider {
  private projectType: string;
  private rolesDefinitonPath: string;

  constructor(config: Config) {
    const kbnServerArgs = config.get('kbnTestServer.serverArgs') as string[];
    this.projectType = kbnServerArgs
      .filter((arg) => arg.startsWith('--serverless'))
      .reduce((acc, arg) => {
        const match = arg.match(/--serverless[=\s](\w+)/);
        return acc + (match ? match[1] : '');
      }, '') as ServerlessProjectType;

    if (!isServerlessProjectType(this.projectType)) {
      throw new Error(`Unsupported serverless projectType: ${this.projectType}`);
    }

    this.rolesDefinitonPath = resolve(SERVERLESS_ROLES_ROOT_PATH, this.projectType, 'roles.yml');
  }

  getSupportedRoleDescriptors(): any {
    return readRolesDescriptorsFromResource(this.rolesDefinitonPath);
  }
  getDefaultRole(): string {
    return getDefaultServerlessRole(this.projectType);
  }
  getRolesDefinitionPath(): string {
    return this.rolesDefinitonPath;
  }
  getCommonRequestHeader() {
    return COMMON_REQUEST_HEADERS;
  }
  getInternalRequestHeader() {
    return getServerlessInternalRequestHeaders();
  }
}
