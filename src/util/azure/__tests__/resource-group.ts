/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { getResourceGroup, ResourceGroup } from '../resource-group';
import { DeviceTokenCredentials } from '@azure/ms-rest-nodeauth';
import { AddOptions } from '../../shared/types';

const RESOURCE_GROUP = 'GROUP';

const credentials = <DeviceTokenCredentials>{};
const options = <AddOptions>{
  resourceGroup: RESOURCE_GROUP
};
const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn()
};

jest.mock('../resource-group-helper');
jest.mock('../../prompt/name-generator');


describe('resource group', () => {
  beforeEach(() => {
    logger.info.mockClear();
  });

  test('should create resource group', async() => {
    const subscription = '';
    const resourceGroup:ResourceGroup = await getResourceGroup(credentials, subscription, options, logger);

    expect(logger.info.mock.calls[0][0]).toBe('Creating resource group GROUP at West US (westus)');
    expect(logger.info.mock.calls.length).toBe(1);
    
    expect(resourceGroup.name).toBe(RESOURCE_GROUP);
  });

  test('should use existing resource group and return it', async() => {
    // there needs to be a match towards resource group list
    const subscription = '';
    const existingMockResourceGroup = 'mock2'
    const optionsWithMatch = { ...options, resourceGroup: existingMockResourceGroup };
    const resourceGroup: ResourceGroup = await getResourceGroup(credentials, subscription, optionsWithMatch, logger);

    expect(logger.info.mock.calls.length).toBe(1);
    expect(logger.info.mock.calls[0][0]).toBe(`Using existing resource group ${existingMockResourceGroup}`);
    expect(resourceGroup.name).toBe(existingMockResourceGroup);
  });
});
