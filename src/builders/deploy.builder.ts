/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { normalize, workspaces } from '@angular-devkit/core';
import { join } from 'path';
import { readFileSync } from 'fs';
import { AzureHostingConfig, AzureJSON } from '../util/workspace/azure-json';
import deploy from './actions/deploy';

export default createBuilder<any>(async (builderConfig: any, context: BuilderContext): Promise<BuilderOutput> => {
  // get the root directory of the project
  const root = normalize(context.workspaceRoot);
  //  NodeJsSyncHost - An implementation of the Virtual FS using Node as the backend, synchronously.
  const host = workspaces.createWorkspaceHost(new NodeJsSyncHost());
  const { workspace } = await workspaces.readWorkspace(root, host);

  if (!context.target) {
    throw new Error('Cannot deploy the application without a target');
  }

  const project = workspace.projects.get(context.target.project);
  if (!project) {
    throw new Error(`Cannot find project ${context.target.project} in the workspace.`);
  }

  const azureProject = getAzureHostingConfig(context.workspaceRoot, context.target.project, builderConfig.config);
  if (!azureProject) {
    throw new Error(`Configuration for project ${context.target.project} was not found in azure.json.`);
  }

  try {
    await deploy(context, join(context.workspaceRoot, project.root), azureProject);
  } catch (e) {
    context.logger.error('Error when trying to deploy: ');
    context.logger.error(e.message);
    return { success: false };
  }
  return { success: true };
});

export function getAzureHostingConfig(
  projectRoot: string,
  target: string,
  azureConfigFile: string
): AzureHostingConfig | undefined {
  const azureJson: AzureJSON = JSON.parse(readFileSync(join(projectRoot, azureConfigFile), 'utf-8'));
  if (!azureJson) {
    throw new Error(`Cannot read configuration file "${azureConfigFile}"`);
  }
  const projects = azureJson.hosting;
  return projects.find((project) => project.app.project === target);
}
