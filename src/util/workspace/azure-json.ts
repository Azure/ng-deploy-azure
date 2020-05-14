/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { SchematicsException, Tree } from '@angular-devkit/schematics';

const azureJsonFile = 'azure.json';

export interface AzureDeployConfig {
  subscription: string;
  resourceGroupName: string;
  account: string;
}

export interface AppDeployConfig {
  project: string;
  target: string;
  path: string;
  configuration?: string;
}

export interface AzureHostingConfig {
  azureHosting: AzureDeployConfig;
  app: AppDeployConfig;
}

export interface AzureJSON {
  hosting: AzureHostingConfig[];
}

export function readAzureJson(tree: Tree): AzureJSON | null {
  return tree.exists(azureJsonFile) ? safeReadJSON(azureJsonFile, tree) : null;
}

export function generateAzureJson(tree: Tree, appDeployConfig: AppDeployConfig, azureDeployConfig: AzureDeployConfig) {
  const azureJson: AzureJSON = readAzureJson(tree) || emptyAzureJson();
  const existingHostingConfigIndex = getAzureHostingConfigIndex(azureJson, appDeployConfig.project);
  const hostingConfig = generateHostingConfig(appDeployConfig, azureDeployConfig);

  if (existingHostingConfigIndex >= 0) {
    azureJson.hosting[existingHostingConfigIndex] = hostingConfig;
  } else {
    azureJson.hosting.push(hostingConfig);
  }

  overwriteIfExists(tree, azureJsonFile, stringifyFormatted(azureJson));
}

export function getAzureHostingConfig(azureJson: AzureJSON, projectName: string): AzureHostingConfig | undefined {
  return azureJson.hosting.find((config) => config.app.project === projectName);
}

function getAzureHostingConfigIndex(azureJson: AzureJSON, project: string): number {
  return azureJson.hosting.findIndex((config) => config.app.project === project);
}

const overwriteIfExists = (tree: Tree, path: string, content: string) => {
  if (tree.exists(path)) {
    tree.overwrite(path, content);
  } else {
    tree.create(path, content);
  }
};

const stringifyFormatted = (obj: any) => JSON.stringify(obj, null, 2);

function emptyAzureJson() {
  return {
    hosting: [],
  };
}

function safeReadJSON(path: string, tree: Tree) {
  try {
    const json = tree.read(path);
    if (!json) {
      throw new Error();
    }
    return JSON.parse(json.toString());
  } catch (e) {
    throw new SchematicsException(`Error when parsing ${path}: ${e.message}`);
  }
}

function generateHostingConfig(appDeployConfig: AppDeployConfig, azureDeployConfig: AzureDeployConfig) {
  return {
    app: appDeployConfig,
    azureHosting: azureDeployConfig,
  };
}
