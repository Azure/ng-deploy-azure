/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {
    interactiveLoginWithAuthResponse,
    DeviceTokenCredentials,
    AuthResponse
} from '@azure/ms-rest-nodeauth';
import { MemoryCache } from 'adal-node';
import { Environment } from '@azure/ms-rest-azure-env';
import Conf from 'conf';
import { Logger } from '../shared/types';

const AUTH = 'auth';

export const globalConfig = new Conf<string | AuthResponse | null>({
    defaults: {
        auth: null
    },
    configName: 'ng-azure'
});

export async function clearCreds() {
    return globalConfig.set(AUTH, null);
}

export async function loginToAzure(logger: Logger): Promise<AuthResponse> {
    let auth = await globalConfig.get(AUTH) as AuthResponse | null;

    if (auth && auth.credentials) {

        const creds = auth.credentials as DeviceTokenCredentials;
        const cache = new MemoryCache();
        cache.add(creds.tokenCache._entries, () => {
        });

        auth.credentials = new DeviceTokenCredentials(
            creds.clientId,
            creds.domain,
            creds.username,
            creds.tokenAudience,
            new Environment(creds.environment),
            cache);

        const token = await auth.credentials.getToken();
        if (new Date(token.expiresOn).getTime() < Date.now()) {
            logger.info(`Your stored credentials have expired; you'll have to log in again`);

            auth = await interactiveLoginWithAuthResponse();
            auth.credentials = auth.credentials as DeviceTokenCredentials;
            globalConfig.set(AUTH, auth);
        }
    } else {
        // user has to log in again
        auth = await interactiveLoginWithAuthResponse();
        globalConfig.set(AUTH, auth);
    }

    return auth;
}
