/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { loginToAzure } from '../util/azure/auth';
import { DeviceTokenCredentials } from '@azure/ms-rest-nodeauth';
import { selectSubscription } from '../util/azure/subscription';
import { getResourceGroup } from '../util/azure/resource-group';
import { getAccount, getAzureStorageClient } from '../util/azure/account';
import { AngularWorkspace } from '../util/workspace/angular-json';
import { generateAzureJson } from '../util/workspace/azure-json';
import { AddOptions } from '../util/shared/types';

export function ngAdd(_options: AddOptions): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        return chain([
            addDeployAzure(_options)
        ])(tree, _context);
    };
}

export function addDeployAzure(_options: AddOptions): Rule {
    return async (tree: Tree, _context: SchematicContext) => {
        // TODO: if azure.json already exists: get data / delete / error

        const project = new AngularWorkspace(tree, _options);

        const auth = await loginToAzure(_context.logger);
        const credentials = auth.credentials as DeviceTokenCredentials;
        project.addLogoutArchitect();

        const subscription = await selectSubscription(auth.subscriptions, _options, _context.logger);

        const resourceGroup = await getResourceGroup(credentials, subscription, _options, _context.logger);

        const client = getAzureStorageClient(credentials, subscription);

        const account = await getAccount(client, resourceGroup, _options, _context.logger);

        const appDeployConfig = {
            project: project.projectName,
            target: project.target,
            configuration: project.configuration,
            path: project.path
        };

        const azureDeployConfig = {
            subscription,
            resourceGroupName: resourceGroup.name,
            account
        };

        // TODO: log url for account at Azure portal
        generateAzureJson(tree, appDeployConfig, azureDeployConfig);

        project.addDeployArchitect();
    };
}
