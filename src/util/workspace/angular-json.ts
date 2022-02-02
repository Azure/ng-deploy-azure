/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { SchematicsException, Tree } from '@angular-devkit/schematics';
// import { JsonParseMode, parseJson } from '@angular-devkit/core';
import { virtualFs, workspaces } from '@angular-devkit/core';
import { ProjectDefinition } from '@angular-devkit/core/src/workspace/definitions';
// import { WorkspaceProject, ProjectType, WorkspaceSchema, WorkspaceTargets, getWorkspace } from 'schematics-utilities';
// import { parseJson } from '@angular-devkit/core/src/json/parser';
// import { WorkspaceDefinition } from '@angular-devkit/core';
// import { WorkspaceTargets } from 'schematics-utilities/dist/angular/workspace-models';
// import { WorkspaceTool } from '@angular-devkit/core/src/experimental/workspace';

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
  // const host = createHost(tree);
  const { workspace } = await workspaces.readWorkspace(path, host);
  return workspace;
}

export class AngularWorkspace {
  tree: Tree;
  workspacePath: string;
  workspace: workspaces.WorkspaceDefinition;
  host: workspaces.WorkspaceHost;
  schema: workspaces.WorkspaceDefinition;
  content: string;
  projectName: string;
  project: ProjectDefinition;
  target: string;
  configuration: string;
  path: string;

  constructor(tree: Tree, options: any) {
    this.tree = tree;
    // this.workspace = await getWorkspace(tree);
    // this.workspacePath = this.getPath();
    // this.content = this.getContent();
    // this.schema = this.getWorkspace();
    // this.projectName = this.getProjectName(options);
    // this.project = this.getProject(options); //as WorkspaceProject<ProjectType.Application>;
    this.target = 'build'; // TODO allow configuration of other options
    this.configuration = 'production';
    /*    this.path = this.project.architect
      ? this.project.architect[this.target].options.outputPath
      : `dist/${ this.projectName }`;*/
  }

  async getWorkspaceData(options: any) {
    this.host = createHost(this.tree);
    this.workspace = await getWorkspace(this.tree, this.host);
    this.projectName = this.getProjectName(options);
    this.project = this.getProject(options);
    this.path = this.getOutputPath(options);
  }

  async getWorkspace() {
    // let schema: WorkspaceDefinition;
    // const host = createHost(this.tree);
    const { workspace } = await workspaces.readWorkspace('/', this.host);
    // let schema = workspace.projects.get('build')
    try {
      // const host = createHost(tree);
      // schema = await workspaces.readWorkspace('/', host);
      // schema = (parseJson(this.content, JsonParseMode.Loose) as {}) as WorkspaceSchema;
    } catch (e) {
      throw new SchematicsException(`Could not parse angular.json: ` + e.message);
    }

    return workspace;
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
    /*if (!this || !this.project || !this.project.architect) {
      throw new SchematicsException('An error has occurred while retrieving project configuration.');
    }

    return this.project.architect;*/
    return this.project.targets;
  }

  async updateTree() {
    await workspaces.writeWorkspace(this.workspace, this.host);
    // this.tree.overwrite(this.workspacePath, JSON.stringify(this.schema, null, 2));
  }

  async addLogoutArchitect() {
    this.getArchitect().set('azureLogout', {
      builder: '@azure/ng-deploy:logout',
    });

    await this.updateTree();
  }

  /*addDeployArchitect() {
    this.getArchitect()['deploy'] = {
      builder: '@azure/ng-deploy:deploy',
      options: {
        host: 'Azure',
        type: 'static',
        config: 'azure.json'
      }
    };

    this.updateTree();
  }*/
}
