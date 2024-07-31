/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { SupertestWithoutAuthProviderType } from '@kbn/ftr-common-functional-services';
import { getTestScenariosForSpace } from '../lib/space_test_utils';
import { DescribeFn, TestDefinitionAuthentication } from '../lib/types';

interface GetTest {
  statusCode: number;
  response: (resp: { [key: string]: any }) => void;
}

interface GetTests {
  default: GetTest;
}

interface GetTestDefinition {
  user?: TestDefinitionAuthentication;
  currentSpaceId: string;
  spaceId: string;
  tests: GetTests;
}

const nonExistantSpaceId = 'not-a-space';

export function getTestSuiteFactory(esArchiver: any, supertest: SupertestWithoutAuthProviderType) {
  const createExpectEmptyResult = () => (resp: { [key: string]: any }) => {
    expect(resp.body).to.eql('');
  };

  const createExpectNotFoundResult = () => (resp: { [key: string]: any }) => {
    expect(resp.body).to.eql({
      error: 'Not Found',
      message: 'Not Found',
      statusCode: 404,
    });
  };

  const createExpectRbacForbidden = (spaceId: string) => (resp: { [key: string]: any }) => {
    expect(resp.body).to.eql({
      statusCode: 403,
      error: 'Forbidden',
      message: `Unauthorized to get ${spaceId} space`,
    });
  };

  const createExpectResults = (spaceId: string) => (resp: { [key: string]: any }) => {
    const allSpaces = [
      {
        id: 'default',
        name: 'Default',
        color: '#00bfb3',
        description: 'This is your default space!',
        _reserved: true,
        disabledFeatures: [],
      },
      {
        id: 'space_1',
        name: 'Space 1',
        description: 'This is the first test space',
        disabledFeatures: [],
      },
      {
        id: 'space_2',
        name: 'Space 2',
        description: 'This is the second test space',
        disabledFeatures: [],
      },
    ];
    expect(resp.body).to.eql(allSpaces.find((space) => space.id === spaceId));
  };

  const makeGetTest =
    (describeFn: DescribeFn) =>
    (description: string, { user, currentSpaceId, spaceId, tests }: GetTestDefinition) => {
      let testAgent: SupertestWithoutAuthProviderType;
      describeFn(description, () => {
        before(() => {
          testAgent = user ? supertest.auth(user.username, user.password) : supertest;
          esArchiver.load(
            'x-pack/test/spaces_api_integration/common/fixtures/es_archiver/saved_objects/spaces'
          );
        });
        after(() =>
          esArchiver.unload(
            'x-pack/test/spaces_api_integration/common/fixtures/es_archiver/saved_objects/spaces'
          )
        );

        getTestScenariosForSpace(currentSpaceId).forEach(({ urlPrefix, scenario }) => {
          it(`should return ${tests.default.statusCode} ${scenario}`, async () => {
            return testAgent
              .get(`${urlPrefix}/api/spaces/space/${spaceId}`)
              .expect(tests.default.statusCode)
              .then(tests.default.response);
          });
        });
      });
    };

  const getTest = makeGetTest(describe);
  // @ts-ignore
  getTest.only = makeGetTest(describe);

  return {
    createExpectResults,
    createExpectRbacForbidden,
    createExpectEmptyResult,
    createExpectNotFoundResult,
    getTest,
    nonExistantSpaceId,
  };
}
