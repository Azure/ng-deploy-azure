/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { SchematicsException, Tree } from '@angular-devkit/schematics';

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

export function generateAzureJson(tree: Tree, appDeployConfig: AppDeployConfig, azureDeployConfig: AzureDeployConfig) {
    const path = 'azure.json';
    const azureJson: AzureJSON = tree.exists(path) ? safeReadJSON(path, tree) : emptyAzureJson();

    if (azureJson.hosting.find(config => config.app.project === appDeployConfig.project)) {
        // TODO: if exists - update?
        throw new SchematicsException(`Target ${ appDeployConfig.project } already exists in ${ path }`);
    }

    azureJson.hosting.push(generateHostingConfig(appDeployConfig, azureDeployConfig));

    overwriteIfExists(tree, path, stringifyFormatted(azureJson));
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
        hosting: []
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
        throw new SchematicsException(`Error when parsing ${ path }: ${ e.message }`);
    }
}


function generateHostingConfig(appDeployConfig: AppDeployConfig, azureDeployConfig: AzureDeployConfig) {
    return {
        app: appDeployConfig,
        azureHosting: azureDeployConfig
    };
}
