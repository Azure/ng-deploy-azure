/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { experimental, normalize, getSystemPath } from '@angular-devkit/core';
import { join } from 'path';
import { readFileSync } from 'fs';
import { AzureHostingConfig, AzureJSON } from '../util/workspace/azure-json';
import deploy from './actions/deploy';

export default createBuilder<any>(
  async (builderConfig: any, context: BuilderContext): Promise<BuilderOutput> => {
    const root = normalize(context.workspaceRoot);
    const workspace = new experimental.workspace.Workspace(root, new NodeJsSyncHost());
    await workspace.loadWorkspaceFromHost(normalize('angular.json')).toPromise();

    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const project = workspace.getProject(context.target.project);
    const workspaceRoot = getSystemPath(workspace.root);

    const azureProject = getAzureHostingConfig(workspaceRoot, context.target.project, builderConfig.config);

    try {
      await deploy(context, join(workspaceRoot, project.root), azureProject);
    } catch (e) {
      context.logger.error('Error when trying to deploy: ');
      context.logger.error(e.message);
      return { success: false };
    }
    return { success: true };
  }
);

export function getAzureHostingConfig(
  projectRoot: string,
  target: string,
  azureConfigFile: string
): AzureHostingConfig | undefined {
  const azureJson: AzureJSON = JSON.parse(readFileSync(join(projectRoot, azureConfigFile), 'UTF-8'));
  const projects = azureJson.hosting;
  return projects.find(project => project.app.project === target);
}
