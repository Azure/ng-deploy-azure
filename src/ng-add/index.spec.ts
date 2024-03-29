/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { confirm } from '../util/prompt/confirm';

jest.mock('../util/azure/auth');
jest.mock('../util/azure/subscription');
jest.mock('../util/azure/resource-group');
jest.mock('../util/azure/account');
jest.mock('../util/prompt/confirm');
import * as AuthModule from '../util/azure/auth';

const collectionPath = require.resolve('../../collection.test.json');

const workspaceOptions: WorkspaceOptions = {
  name: 'workspace',
  newProjectRoot: 'tests',
  version: '9.1.4',
};

const appOptions: ApplicationOptions = { name: 'test-app' };
const schemaOptions: any = {
  name: 'foo',
  project: 'test-app',
};

describe('ng add @azure/ng-deploy', () => {
  const testRunner = new SchematicTestRunner('schematics', collectionPath);

  async function initAngularProject(): Promise<UnitTestTree> {
    const appTree = await testRunner
      .runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions)
      .toPromise();
    return await testRunner
      .runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree)
      .toPromise();
  }

  it('fails with a missing tree', async () => {
    await expect(testRunner.runSchematicAsync('ng-add', schemaOptions, Tree.empty()).toPromise()).rejects.toThrow();
  });

  it('adds azure deploy to an existing project', async () => {
    let appTree = await initAngularProject();
    appTree = await testRunner.runSchematicAsync('ng-add', schemaOptions, appTree).toPromise();
    const angularJson = JSON.parse(appTree.readContent('/angular.json'));

    expect(angularJson.projects[appOptions.name].architect.deploy).toBeDefined();
    expect(angularJson.projects[appOptions.name].architect.azureLogout).toBeDefined();
    expect(appTree.files).toContain('/azure.json');

    const azureJson = JSON.parse(appTree.readContent('/azure.json'));
    expect(azureJson).toEqual({
      hosting: [
        {
          app: {
            configuration: 'production',
            path: 'dist/test-app',
            project: 'test-app',
            target: 'build',
          },
          azureHosting: {
            account: 'fakeStorageAccount',
            resourceGroupName: 'fake-resource-group',
            subscription: 'fake-subscription-1234',
          },
        },
      ],
    });
  });

  it('should overwrite existing hosting config', async () => {
    // Simulate existing app setup
    let appTree = await initAngularProject();
    appTree = await testRunner.runSchematicAsync('ng-add', schemaOptions, appTree).toPromise();
    appTree.overwrite('/azure.json', appTree.readContent('azure.json').replace(/fake/g, 'existing'));

    const confirmMock = confirm as jest.Mock;
    confirmMock.mockClear();
    confirmMock.mockImplementationOnce(() => Promise.resolve(true));

    // Run ng add @azure/deploy on existing project
    appTree = await testRunner.runSchematicAsync('ng-add', schemaOptions, appTree).toPromise();

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(appTree.files).toContain('/azure.json');

    const azureJson = JSON.parse(appTree.readContent('/azure.json'));
    expect(azureJson).toEqual({
      hosting: [
        {
          app: {
            configuration: 'production',
            path: 'dist/test-app',
            project: 'test-app',
            target: 'build',
          },
          azureHosting: {
            account: 'fakeStorageAccount',
            resourceGroupName: 'fake-resource-group',
            subscription: 'fake-subscription-1234',
          },
        },
      ],
    });
  });

  it('should keep existing hosting config', async () => {
    // Simulate existing app setup
    let appTree = await initAngularProject();
    appTree = await testRunner.runSchematicAsync('ng-add', schemaOptions, appTree).toPromise();
    appTree.overwrite('/azure.json', appTree.readContent('azure.json').replace(/fake/g, 'existing'));

    const confirmMock = confirm as jest.Mock;
    confirmMock.mockClear();
    confirmMock.mockImplementationOnce(() => Promise.resolve(false));

    // Run ng add @azure/deploy on existing project
    appTree = await testRunner.runSchematicAsync('ng-add', schemaOptions, appTree).toPromise();

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(appTree.files).toContain('/azure.json');

    const azureJson = JSON.parse(appTree.readContent('/azure.json'));
    expect(azureJson).toEqual({
      hosting: [
        {
          app: {
            configuration: 'production',
            path: 'dist/test-app',
            project: 'test-app',
            target: 'build',
          },
          azureHosting: {
            account: 'existingStorageAccount',
            resourceGroupName: 'existing-resource-group',
            subscription: 'existing-subscription-1234',
          },
        },
      ],
    });
  });
  describe('when CI=1 is detected', () => {
    it('should call loginToAzureWithCI()', async () => {
      process.env.CI = '1';
      const loginToAzureWithCI = jest.spyOn(AuthModule, 'loginToAzureWithCI');

      let appTree = await initAngularProject();
      appTree = await testRunner.runSchematicAsync('ng-add', schemaOptions, appTree).toPromise();

      expect(loginToAzureWithCI).toHaveBeenCalled();
    });
    it('should NOT call loginToAzure()', async () => {
      process.env.CI = '1';
      const loginToAzure = jest.spyOn(AuthModule, 'loginToAzure');

      let appTree = await initAngularProject();
      appTree = await testRunner.runSchematicAsync('ng-add', schemaOptions, appTree).toPromise();

      expect(loginToAzure).not.toHaveBeenCalled();
    });
  });
});
