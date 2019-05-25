/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { DeviceTokenCredentials } from '@azure/ms-rest-nodeauth';
import { filteredList } from '../prompt/list';
import { getLocation, locations, StorageLocation } from './locations';
import { AddOptions, Logger } from '../shared/types';
import { generateName } from '../prompt/name-generator';
import { getResourceGroups, ResourceGroupDetails, createResourceGroup } from './resource-group-helper';
import { spinner } from '../prompt/spinner';

const defaultLocation = {
    id: 'westus',
    name: 'West US'
};

export interface ResourceGroup {
    id: string;
    name: string;
    location: string;
}

const resourceGroupsPromptOptions = {
    id: 'resourceGroup',
    message: 'Under which resource group should we put this static site?'
};

const newResourceGroupsPromptOptions = {
    id: 'newResourceGroup',
    message: 'Enter a name for the new resource group:',
    name: 'Create a new resource group',
    default: ''
};

const locationPromptOptions = {
    id: 'location',
    message: 'In which location should the storage account be created?'
};

export async function getResourceGroup(
    creds: DeviceTokenCredentials, subscription: string, options: AddOptions, logger: Logger
): Promise<ResourceGroup> {

    let resourceGroupName = options.resourceGroup || '';
    let location = getLocation(options.location);

    spinner.start('Fetching resource groups');
    const resourceGroupList = await getResourceGroups(creds, subscription);
    spinner.stop();
    let result;

    const initialName = options.project + '-static-deploy';
    const defaultResourceGroupName = await resourceGroupNameGenerator(initialName, resourceGroupList);

    if (!options.manual) { // quickstart
        resourceGroupName = resourceGroupName || defaultResourceGroupName;
        location = location || defaultLocation;
    }

    if (!!resourceGroupName) { // provided or quickstart + default
        result = resourceGroupList.find(rg => rg.name === resourceGroupName);
        if (!!result) {
            logger.info(`Using existing resource group ${ resourceGroupName }`);
        }
    } else { // not provided + manual

        // TODO: default name can be assigned later, only if creating a new resource group.
        // TODO: check availability of the default name
        newResourceGroupsPromptOptions.default = defaultResourceGroupName;

        result = (await filteredList(
            resourceGroupList,
            resourceGroupsPromptOptions,
            newResourceGroupsPromptOptions));

        // TODO: add check whether the new resource group doesn't already exist.
        //  Currently throws an error of exists in a different location:
        //  Invalid resource group location 'westus'. The Resource group already exists in location 'eastus2'.

        result = result.resourceGroup || result;
        resourceGroupName = result.newResourceGroup || result.name;
    }

    if (!result || result.newResourceGroup) {
        location = location || await askLocation(); // if quickstart - location defined above
        spinner.start(`Creating resource group ${ resourceGroupName } at ${ location.name } (${ location.id })`);
        result = await createResourceGroup(resourceGroupName, subscription, creds, location.id);
        spinner.succeed();
    }

    return result;
}

export async function askLocation(): Promise<StorageLocation> {
    const res = await filteredList(locations, locationPromptOptions);
    return res.location;
}

function resourceGroupExists(resourceGroupList: ResourceGroupDetails[]) {
    return async (name: string) => {
        return Promise.resolve(!resourceGroupList.find(rg => rg.name === name));
    };
}

async function resourceGroupNameGenerator(initialName: string, resourceGroupList: ResourceGroupDetails[]) {
    return await generateName(initialName, resourceGroupExists(resourceGroupList));
}
