/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createSAMLResponse as createMockedSAMLResponse } from '@kbn/mock-idp-plugin/common';
import { ToolingLog } from '@kbn/tooling-log';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { parse as parseCookie } from 'tough-cookie';
import Url from 'url';
import { Session } from './svl_user_manager';

export interface CloudSamlSessionParams {
  email: string;
  password: string;
  kbnHost: string;
  kbnVersion: string;
  log: ToolingLog;
}

export interface LocalSamlSessionParams {
  username: string;
  email: string;
  fullname: string;
  role: string;
  kbnHost: string;
  log: ToolingLog;
}

export interface CreateSamlSessionParams {
  hostname: string;
  email: string;
  password: string;
  log: ToolingLog;
}

const getSessionCookie = (cookieString: string) => {
  return parseCookie(cookieString);
};

const getCloudHostName = () => {
  const hostname = process.env.TEST_CLOUD_HOST_NAME;
  if (!hostname) {
    throw new Error('SAML Authentication requires TEST_CLOUD_HOST_NAME env variable to be set');
  }

  return hostname;
};

const getCloudUrl = (hostname: string, pathname: string) => {
  return Url.format({
    protocol: 'https',
    hostname,
    pathname,
  });
};

const createCloudSession = async (params: CreateSamlSessionParams) => {
  const { hostname, email, password, log } = params;
  const cloudLoginUrl = getCloudUrl(hostname, '/api/v1/users/_login');
  const sessionResponse: AxiosResponse = await axios.request({
    url: cloudLoginUrl,
    method: 'post',
    data: {
      email,
      password,
    },
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    validateStatus: () => true,
    maxRedirects: 0,
  });
  const firstName = sessionResponse?.data?.user?.data?.first_name ?? '';
  const lastName = sessionResponse?.data?.user?.data?.last_name ?? '';
  const firstLastNames = `${firstName} ${lastName}`.trim();
  const fullname = firstLastNames.length > 0 ? firstLastNames : email;
  const token = sessionResponse?.data?.token as string;
  if (!token) {
    log.error(
      `Failed to create cloud session, token is missing in response data: ${JSON.stringify(
        sessionResponse?.data
      )}`
    );
    throw new Error(`Unable to create Cloud session, token is missing.`);
  }
  return { token, fullname };
};

const createSAMLRequest = async (kbnUrl: string, kbnVersion: string) => {
  const samlResponse: AxiosResponse = await axios.request({
    url: kbnUrl + '/internal/security/login',
    method: 'post',
    data: {
      providerType: 'saml',
      providerName: 'cloud-saml-kibana',
      currentURL: kbnUrl + '/login?next=%2F"',
    },
    headers: {
      'kbn-version': kbnVersion,
      'x-elastic-internal-origin': 'Kibana',
      'content-type': 'application/json',
    },
    validateStatus: () => true,
    maxRedirects: 0,
  });
  const cookie = getSessionCookie(samlResponse.headers['set-cookie']![0])!;
  return { location: samlResponse.data.location, sid: cookie.value };
};

const createSAMLResponse = async (url: string, ecSession: string) => {
  const samlResponse = await axios.get(url, {
    headers: {
      Cookie: `ec_session=${ecSession}`,
    },
  });
  const $ = cheerio.load(samlResponse.data);
  const value = $('input').attr('value') ?? '';
  if (value.length === 0) {
    throw new Error('Failed to parse SAML response value');
  }
  return value;
};

const finishSAMLHandshake = async ({
  kbnHost,
  samlResponse,
  sid,
  log,
}: {
  kbnHost: string;
  samlResponse: string;
  sid?: string;
  log: ToolingLog;
}) => {
  const encodedResponse = encodeURIComponent(samlResponse);
  let authResponse: AxiosResponse;

  try {
    authResponse = await axios.request({
      url: kbnHost + '/api/security/saml/callback',
      method: 'post',
      data: `SAMLResponse=${encodedResponse}`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(sid ? { Cookie: `sid=${sid}` } : {}),
      },
      validateStatus: () => true,
      maxRedirects: 0,
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      log.debug(JSON.stringify(err));
    }
    throw err;
  }

  return getSessionCookie(authResponse!.headers['set-cookie']![0])!;
};

export const createCloudSAMLSession = async (params: CloudSamlSessionParams) => {
  const { email, password, kbnHost, kbnVersion, log } = params;
  const hostname = getCloudHostName();
  const { token, fullname } = await createCloudSession({ hostname, email, password, log });
  const { location, sid } = await createSAMLRequest(kbnHost, kbnVersion);
  const samlResponse = await createSAMLResponse(location, token);
  const cookie = await finishSAMLHandshake({ kbnHost, samlResponse, sid, log });
  return new Session(cookie, email, fullname);
};

export const createLocalSAMLSession = async (params: LocalSamlSessionParams) => {
  const { username, email, fullname, role, kbnHost, log } = params;
  const samlResponse = await createMockedSAMLResponse({
    kibanaUrl: kbnHost + '/api/security/saml/callback',
    username,
    fullname,
    email,
    roles: [role],
  });
  const cookie = await finishSAMLHandshake({ kbnHost, samlResponse, log });
  return new Session(cookie, email, fullname);
};
