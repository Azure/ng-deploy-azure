/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {
  interactiveLoginWithAuthResponse,
  DeviceTokenCredentials,
  AuthResponse,
  loginWithServicePrincipalSecretWithAuthResponse,
} from '@azure/ms-rest-nodeauth';
import { MemoryCache, TokenResponse } from 'adal-node';
import { Environment } from '@azure/ms-rest-azure-env';
import * as Conf from 'conf';
import { Logger } from '../shared/types';
import { buildTenantList } from '@azure/ms-rest-nodeauth/dist/lib/subscriptionManagement/subscriptionUtils';

const AUTH = 'auth';

export type TokenCredentials = DeviceTokenCredentials & { tokenCache: { _entries: TokenResponse[] } };

interface GlobalConfig {
  auth: AuthResponse | null;
}

export const globalConfig = new Conf<GlobalConfig>({
  defaults: {
    auth: null,
  },
  configName: 'ng-azure',
});

export async function clearCreds() {
  return globalConfig.set(AUTH, null);
}

/**
 * safe guard if things get wrong and we don't get an AUTH object.
 * we exit if:
 * - auth is not valid
 * - auth.credentials doesn't exist
 * - auth.credentials.getToken is not a function
 */
function safeCheckForValidAuthSignature(auth: AuthResponse) {
  const isEmpty = (o: object) => Object.entries(o).length === 0;
  if (
    auth === null ||
    (auth && isEmpty(auth.credentials)) ||
    (auth && auth.credentials && typeof auth.credentials.getToken !== 'function')
  ) {
    throw new Error(
      `There was an issue during the login process.\n
      Make sure to delete "${globalConfig.path}" and try again.`
    );
  }
}

export async function loginToAzure(logger: Logger): Promise<AuthResponse> {
  // a retry login helper function
  const retryLogin = async (_auth: AuthResponse | null, tenant: string = ''): Promise<AuthResponse> => {
    _auth = await interactiveLoginWithAuthResponse(!!tenant ? { domain: tenant } : {});
    safeCheckForValidAuthSignature(_auth);
    if (!tenant && (!_auth.subscriptions || _auth.subscriptions.length === 0)) {
      logger.info(`Due to an issue regarding authentication with the wrong tenant, we ask you to log in again.`);
      const tenants = await buildTenantList(_auth.credentials);
      _auth = await retryLogin(_auth, tenants[0]);
    }
    _auth.credentials = _auth.credentials as TokenCredentials;
    globalConfig.set(AUTH, _auth);
    return _auth;
  };

  // check old AUTH config from cache
  let auth = (await globalConfig.get(AUTH)) as AuthResponse | null;

  // if old AUTH config is not found, we trigger a new login flow
  if (auth === null) {
    auth = await retryLogin(auth, process.env.AZURE_TENANT_ID);
  } else {
    const creds = auth.credentials as TokenCredentials;
    const { clientId, domain, username, tokenAudience, environment } = creds;

    // if old AUTH config was found, we extract and check if the required fields are valid
    if (creds && clientId && domain && username && tokenAudience && environment) {
      const cache = new MemoryCache();
      cache.add(creds.tokenCache._entries, () => {});

      // we need to regenerate a proper object from the saved credentials
      auth.credentials = new DeviceTokenCredentials(
        clientId,
        domain,
        username,
        tokenAudience,
        new Environment(environment),
        cache
      );

      const token = await auth.credentials.getToken();
      // if extracted token has expired, we request a new login flow
      if (new Date(token.expiresOn).getTime() < Date.now()) {
        logger.info(`Your stored credentials have expired; you'll have to log in again`);

        auth = await retryLogin(auth);
      }
    } else {
      // if old AUTH config was found, but the required fields are NOT valid, we trigger a new login flow
      auth = await retryLogin(auth);
    }
  }

  return auth as AuthResponse;
}

export async function loginToAzureWithCI(logger: Logger): Promise<AuthResponse> {
  logger.info(`Checking for configuration...`);
  const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, AZURE_SUBSCRIPTION_ID } = process.env;

  if (CLIENT_ID) {
    logger.info(`Using CLIENT_ID=${CLIENT_ID}`);
  } else {
    throw new Error('CLIENT_ID is required in CI mode');
  }

  if (CLIENT_SECRET) {
    logger.info(`Using CLIENT_SECRET=${CLIENT_SECRET.replace(/\w/g, '*')}`);
  } else {
    throw new Error('CLIENT_SECRET is required in CI mode');
  }

  if (TENANT_ID) {
    logger.info(`Using TENANT_ID=${TENANT_ID}`);
  } else {
    throw new Error('TENANT_ID is required in CI mode');
  }

  if (AZURE_SUBSCRIPTION_ID) {
    logger.info(`Using AZURE_SUBSCRIPTION_ID=${AZURE_SUBSCRIPTION_ID}`);
  } else {
    throw new Error('AZURE_SUBSCRIPTION_ID is required in CI mode');
  }
  logger.info(`Configuration OK`);

  return await loginWithServicePrincipalSecretWithAuthResponse(CLIENT_ID, CLIENT_SECRET, TENANT_ID);
}
