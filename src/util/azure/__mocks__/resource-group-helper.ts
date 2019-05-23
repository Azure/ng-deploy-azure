/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export async function getResourceGroups() {
  return Promise.resolve([{
    id: '1',
    name: 'mock',
    location: 'location'
  },
  {
    id: '2',
    name: 'mock2',
    location: 'location'
  },
  {
    id: '3',
    name: 'mock3',
    location: 'location'
  }]);
}

export async function createResourceGroup(name: string) {
  return Promise.resolve({ name });
}

