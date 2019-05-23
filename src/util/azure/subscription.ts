/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { LinkedSubscription } from '@azure/ms-rest-nodeauth';
import { prompt } from 'inquirer';
import { AddOptions, Logger } from '../shared/types';


export async function selectSubscription(
    subs: LinkedSubscription[] | undefined,
    options: AddOptions,
    logger: Logger
): Promise<string> {
    if (Array.isArray(subs)) {
        if (subs.length === 0) {
            throw new Error(
                'You don\'t have any active subscriptions. ' +
                'Head to https://azure.com/free and sign in. From there you can create a new subscription ' +
                'and then you can come back and try again.'
            );
        }

        const subProvided = !!options.subscriptionId || !!options.subscriptionName;
        const foundSub = subs.find(sub => {
            // TODO: provided id and name might be of different subscriptions or one with typo
            return sub.id === options.subscriptionId || sub.name === options.subscriptionName;
        });

        if (foundSub) {
            return foundSub.id;
        } else if (subProvided) {
            logger.warn(`The provided subscription ID does not exist.`);
        }

        if (subs.length === 1) {
            if (subProvided) {
                logger.warn(`Using subscription ${ subs[0].name } - ${ subs[0].id }`);
            }
            return subs[0].id;
        } else {
            const { sub } = await prompt([
                {
                    type: 'list',
                    name: 'sub',
                    choices: subs.map(choice => ({
                        name: `${ choice.name } – ${ choice.id }`,
                        value: choice.id
                    })),
                    message: 'Under which subscription should we put this static site?'
                }
            ]);
            return sub;
        }
    }

    throw new Error(
        'API returned no subscription IDs. It should. ' +
        'Log in to https://portal.azure.com and see if there\'s something wrong with your account.'
    );
}
