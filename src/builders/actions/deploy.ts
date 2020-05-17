/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { lookup, charset } from 'mime-types';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import * as promiseLimit from 'promise-limit';
import * as ProgressBar from 'progress';
import { BuilderContext, Target } from '@angular-devkit/architect';
import { AzureHostingConfig } from '../../util/workspace/azure-json';
import { StorageManagementClient } from '@azure/arm-storage';
import { getAccountKey } from '../../util/azure/account';
import * as chalk from 'chalk';
import { loginToAzure, loginToAzureWithCI } from '../../util/azure/auth';
import { AuthResponse } from '@azure/ms-rest-nodeauth';

export default async function deploy(
  context: BuilderContext,
  projectRoot: string,
  azureHostingConfig?: AzureHostingConfig
) {
  if (!context.target) {
    throw new Error('Cannot run target deploy. Context is missing a target object.');
  }

  if (!azureHostingConfig) {
    throw new Error('Cannot find Azure hosting config for your app in azure.json');
  }

  if (
    !azureHostingConfig.app ||
    !azureHostingConfig.azureHosting ||
    !azureHostingConfig.azureHosting.subscription ||
    !azureHostingConfig.azureHosting.resourceGroupName ||
    !azureHostingConfig.azureHosting.account
  ) {
    throw new Error('Azure hosting config is missing some details. Please run "ng add @azure/ng-deploy"');
  }

  let auth = {} as AuthResponse;
  if (process.env['CI']) {
    context.logger.info(`CI mode detected`);
    auth = await loginToAzureWithCI(context.logger);
  } else {
    auth = await loginToAzure(context.logger);
  }
  const credentials = await auth.credentials;

  context.logger.info('Preparing for deployment');

  let filesPath = null;

  if (azureHostingConfig.app.target) {
    // build the project

    const target: Target = {
      target: azureHostingConfig.app.target,
      project: context.target.project,
    };
    if (azureHostingConfig.app.configuration) {
      target.configuration = azureHostingConfig.app.configuration;
    }
    context.logger.info(`📦 Running "${azureHostingConfig.app.target}" on "${context.target.project}"`);

    const run = await context.scheduleTarget(target);
    const targetResult = await run.result;
    if (!targetResult.success) {
      throw new Error(`Target failed: ${targetResult.error}`);
    }
    filesPath = targetResult.outputPath as string;

    if (!filesPath) {
      if (azureHostingConfig.app.path) {
        context.logger.warn(`Target was executed but does not provide a result file path.
        Fetching files from the path configured in azure.json: ${azureHostingConfig.app.path}`);
        filesPath = path.join(projectRoot, azureHostingConfig.app.path);
        console.log(filesPath);
      }
    }
  } else if (azureHostingConfig.app.path) {
    context.logger.info(`Fetching files from the path configured in azure.json: ${azureHostingConfig.app.path}`);
    filesPath = path.join(projectRoot, azureHostingConfig.app.path);
  }

  if (!filesPath) {
    throw new Error('No path is configured for the files to deploy.');
  }

  const files = await getFiles(context, filesPath, projectRoot);
  if (files.length === 0) {
    throw new Error('Target did not produce any files, or the path is incorrect.');
  }

  const client = new StorageManagementClient(credentials, azureHostingConfig.azureHosting.subscription);
  const accountKey = await getAccountKey(
    azureHostingConfig.azureHosting.account,
    client,
    azureHostingConfig.azureHosting.resourceGroupName
  );

  const sharedKeyCredential = new StorageSharedKeyCredential(azureHostingConfig.azureHosting.account, accountKey);

  const blobServiceClient = new BlobServiceClient(
    `https://${azureHostingConfig.azureHosting.account}.blob.core.windows.net`,
    sharedKeyCredential
  );

  await uploadFilesToAzure(blobServiceClient, context, filesPath, files);

  const accountProps = await client.storageAccounts.getProperties(
    azureHostingConfig.azureHosting.resourceGroupName,
    azureHostingConfig.azureHosting.account
  );
  const endpoint = accountProps.primaryEndpoints && accountProps.primaryEndpoints.web;

  context.logger.info(chalk.green(`see your deployed site at ${endpoint}`));
  // TODO: log url for account at Azure portal
}

function getFiles(context: BuilderContext, filesPath: string, _projectRoot: string) {
  return glob.sync(`**`, {
    ignore: ['.git', '.azez.json'],
    cwd: filesPath,
    nodir: true,
  });
}

export async function uploadFilesToAzure(
  serviceClient: BlobServiceClient,
  context: BuilderContext,
  filesPath: string,
  files: string[]
): Promise<void> {
  context.logger.info('preparing static deploy');
  const containerClient = serviceClient.getContainerClient('$web');

  const bar = new ProgressBar('[:bar] :current/:total files uploaded | :percent done | :elapseds | eta: :etas', {
    total: files.length,
  });

  bar.tick(0);

  await promiseLimit(5).map(files, async function (file: string) {
    const blockBlobClient = containerClient.getBlockBlobClient(file);

    const blobContentType = lookup(file) || '';
    const blobContentEncoding = charset(blobContentType) || '';

    await blockBlobClient.uploadStream(fs.createReadStream(path.join(filesPath, file)), 4 * 1024 * 1024, 20, {
      blobHTTPHeaders: {
        blobContentType,
        blobContentEncoding,
      },
      onProgress: (_progress) => bar.tick(1),
    });
  });

  bar.terminate();
  context.logger.info('deploying static site');
}
