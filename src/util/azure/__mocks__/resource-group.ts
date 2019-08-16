/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const getResourceGroup = () =>
  Promise.resolve({
    id: '4321',
    name: 'fake-resource-group',
    location: 'westus'
  });
