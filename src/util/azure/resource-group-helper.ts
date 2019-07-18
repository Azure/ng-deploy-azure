/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ResourceManagementClient } from "@azure/arm-resources";
import { ListItem } from "../prompt/list";
import { DeviceTokenCredentials } from "@azure/ms-rest-nodeauth";
import { ResourceGroupsCreateOrUpdateResponse } from "@azure/arm-resources/esm/models";

export interface ResourceGroupDetails extends ListItem {
  id: string;
  name: string;
  properties?: any;
  location: string;
}

export async function getResourceGroups(creds: DeviceTokenCredentials, subscription: string) {
  const client = new ResourceManagementClient(creds, subscription);
  const resourceGroupList = await client.resourceGroups.list() as ResourceGroupDetails[];
  return resourceGroupList;
}

export async function createResourceGroup(
  name: string,
  subscription: string,
  creds: DeviceTokenCredentials,
  location: string
): Promise<ResourceGroupsCreateOrUpdateResponse> {
  // TODO: throws an error here if the subscription is wrong
  const client = new ResourceManagementClient(creds, subscription);
  const resourceGroupRes = await client.resourceGroups.createOrUpdate(name, { location });
  return resourceGroupRes;
}

