/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const loginToAzure = () =>
  Promise.resolve({
    credentials: null,
    subscriptions: [],
  });

export const loginToAzureWithCI = () =>
  Promise.resolve({
    credentials: null,
    subscriptions: [],
  });
