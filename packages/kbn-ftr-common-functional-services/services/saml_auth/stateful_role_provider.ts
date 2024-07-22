/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { readRolesDescriptorsFromResource, STATEFUL_ROLES_ROOT_PATH } from '@kbn/es';
import { REPO_ROOT } from '@kbn/repo-info';
import { resolve } from 'path';
import { AuthRoleProvider } from './auth_role_provider';

export class StatefuAuthRoleProvider implements AuthRoleProvider {
  private rolesDefinitionPath: string;

  constructor() {
    this.rolesDefinitionPath = resolve(REPO_ROOT, STATEFUL_ROLES_ROOT_PATH, 'roles.yml');
  }
  getSupportedRoleDescriptors(): any {
    return readRolesDescriptorsFromResource(this.rolesDefinitionPath);
  }
  getDefaultRole(): string {
    return 'editor';
  }
  getRolesDefinitionPath(): string {
    return this.rolesDefinitionPath;
  }
}
