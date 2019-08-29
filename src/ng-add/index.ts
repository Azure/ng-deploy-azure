/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { confirm } from '../util/prompt/confirm';
import { loginToAzure, loginToAzureWithCI } from '../util/azure/auth';
import { DeviceTokenCredentials, AuthResponse } from '@azure/ms-rest-nodeauth';
import { selectSubscription } from '../util/azure/subscription';
import { getResourceGroup } from '../util/azure/resource-group';
import { getAccount, getAzureStorageClient } from '../util/azure/account';
import { AngularWorkspace } from '../util/workspace/angular-json';
import { generateAzureJson, readAzureJson, getAzureHostingConfig } from '../util/workspace/azure-json';
import { AddOptions } from '../util/shared/types';
import { startInsights } from '../util/azure/app-insights';

const environment = require('../environments/environment.json');

export function ngAdd(_options: AddOptions): Rule {
  if (_options.telemetry) {
    startInsights(environment.insightsKey, environment.production);
  }

  return (tree: Tree, _context: SchematicContext) => {
    return chain([addDeployAzure(_options)])(tree, _context);
  };
}

export function addDeployAzure(_options: AddOptions): Rule {
  return async (tree: Tree, _context: SchematicContext) => {
    const project = new AngularWorkspace(tree, _options);
    const azureJson = readAzureJson(tree);
    const hostingConfig = azureJson ? getAzureHostingConfig(azureJson, project.projectName) : null;

    if (!hostingConfig || (await confirm(`Overwrite existing Azure config for ${project.projectName}?`))) {
      let auth = {} as AuthResponse;
      let subscription = '';
      if (process.env['CI']) {
        _context.logger.info(`CI mode detected`);
        auth = await loginToAzureWithCI(_context.logger);
        // the AZURE_SUBSCRIPTION_ID variable is validated inside the loginToAzureWithCI
        // so we have the guarrantee that the value is not empty.
        subscription = process.env.AZURE_SUBSCRIPTION_ID as string;

        // make sure the project property is set correctly
        // this is needed when creating a storage account
        _options = {
          ..._options,
          project: project.projectName
        };
      } else {
        auth = await loginToAzure(_context.logger);
        subscription = await selectSubscription(auth.subscriptions, _options, _context.logger);
      }

      const credentials = auth.credentials as DeviceTokenCredentials;
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
    }

    project.addLogoutArchitect();
    project.addDeployArchitect();
  };
}
