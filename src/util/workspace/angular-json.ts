/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { virtualFs, workspaces } from '@angular-devkit/core';
import { ProjectDefinition } from '@angular-devkit/core/src/workspace/definitions';

export function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      if (!data) {
        throw new SchematicsException('File not found.');
      }
      return virtualFs.fileBufferToString(data);
    },
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },
    async isDirectory(path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    },
  };
}

export async function getWorkspace(tree: Tree, host: workspaces.WorkspaceHost, path = '/') {
  const { workspace } = await workspaces.readWorkspace(path, host);
  return workspace;
}

export class AngularWorkspace {
  tree: Tree;
  workspace: workspaces.WorkspaceDefinition;
  host: workspaces.WorkspaceHost;
  schema: workspaces.WorkspaceDefinition;
  content: string;
  projectName: string;
  project: ProjectDefinition;
  target: string;
  configuration: string;
  path: string;

  constructor(tree: Tree) {
    this.tree = tree;
    this.target = 'build'; // TODO allow configuration of other options
    this.configuration = 'production';
  }

  async getWorkspaceData(options: any) {
    this.host = createHost(this.tree);
    this.workspace = await getWorkspace(this.tree, this.host);
    this.projectName = this.getProjectName(options);
    this.project = this.getProject(options);
    this.path = this.getOutputPath(options);
  }

  getProjectName(options: any) {
    let projectName = options.project;

    if (!options.project && typeof this.workspace.extensions.defaultProject === 'string') {
      options.project = this.workspace.extensions.defaultProject;
    }

    if (!projectName) {
      throw new SchematicsException('No project selected and no default project name available in the workspace.');
    }
    return projectName;
  }

  getProject(options: any) {
    const project = this.workspace.projects.get(this.projectName);
    if (!project) {
      throw new SchematicsException(`Project "${this.projectName}" is not defined in this workspace`);
    }

    if (project.extensions.projectType !== 'application') {
      throw new SchematicsException(`Cannot set up deployment for a project that is not of type "application"`);
    }

    return project;
  }

  getOutputPath(options: any): string {
    const buildTarget = this.project.targets.get('build');
    if (!buildTarget) {
      throw new SchematicsException(`Build target does not exist.`);
    }

    const outputPath =
      typeof buildTarget.options?.outputPath === 'string'
        ? buildTarget?.options?.outputPath
        : `dist/${this.projectName}`;
    return outputPath;
  }

  getArchitect() {
    return this.project.targets;
  }

  async updateTree() {
    await workspaces.writeWorkspace(this.workspace, this.host);
  }

  async addLogoutArchitect() {
    this.getArchitect().set('azureLogout', {
      builder: '@azure/ng-deploy:logout',
    });

    await this.updateTree();
  }

  async addDeployArchitect() {
    this.getArchitect().set('deploy', {
      builder: '@azure/ng-deploy:deploy',
      options: {
        host: 'Azure',
        type: 'static',
        config: 'azure.json',
      },
    });

    await this.updateTree();
  }
}
