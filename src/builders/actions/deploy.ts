/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { lookup, charset } from 'mime-types';
import {
    uploadStreamToBlockBlob,
    Aborter,
    BlobURL,
    BlockBlobURL,
    ContainerURL,
    ServiceURL,
    SharedKeyCredential
} from '@azure/storage-blob';
import * as promiseLimit from 'promise-limit';
import * as ProgressBar from 'ascii-progress';
import { promisify } from 'util';
import { BuilderContext, Target } from '@angular-devkit/architect';
import { AzureHostingConfig } from '../../util/workspace/azure-json';
import { StorageManagementClient } from '@azure/arm-storage';
import { getAccountKey } from '../../util/azure/account';
import chalk from 'chalk';
import { loginToAzure } from '../../util/azure/auth';

export default async function deploy(context: BuilderContext, projectRoot: string, azureHostingConfig?: AzureHostingConfig) {
    if (!azureHostingConfig) {
        throw new Error('Cannot find Azure hosting config for your app in azure.json');
    }

    if (
        !azureHostingConfig.app ||
        !azureHostingConfig.azureHosting ||
        !azureHostingConfig.azureHosting.subscription ||
        !azureHostingConfig.azureHosting.resourceGroupName ||
        !azureHostingConfig.azureHosting.account ||
        !azureHostingConfig.app.project ||
        !azureHostingConfig.app.target
    ) {
        throw new Error('Azure hosting config is missing some details. Please run "ng add ng-deploy-azure" and select a storage account.');
    }

    const auth = await loginToAzure(context.logger);
    const credentials = await auth.credentials;

    context.logger.info('Preparing for deployment');

    const filesPath = path.join(projectRoot, azureHostingConfig.app.path);
    let files = await getFiles(context, filesPath, projectRoot);

    if (files.length === 0) {
        // build the project

        context.logger.info(`The folder ${ azureHostingConfig.app.path } is empty.`);
        if (!context.target) {
            throw new Error('Cannot execute the target');
        }

        const target: Target = {
            target: azureHostingConfig.app.target,
            project: context.target.project
        };
        if (azureHostingConfig.app.configuration) {
            target.configuration = azureHostingConfig.app.configuration;
        }
        context.logger.info(`📦 Running "${ azureHostingConfig.app.target }" on "${ context.target.project }"`);

        const run = await context.scheduleTarget(target);
        await run.result;

        files = await getFiles(context, filesPath, projectRoot);
        if (files.length === 0) {
            throw new Error('Target did not produce any files, or the path is incorrect.');
        }
    }

    const client = new StorageManagementClient(credentials, azureHostingConfig.azureHosting.subscription);
    const accountKey = await getAccountKey(
        azureHostingConfig.azureHosting.account, client, azureHostingConfig.azureHosting.resourceGroupName);

    const pipeline = ServiceURL.newPipeline(
        new SharedKeyCredential(azureHostingConfig.azureHosting.account, accountKey)
    );

    const serviceURL = new ServiceURL(
        `https://${ azureHostingConfig.azureHosting.account }.blob.core.windows.net`,
        pipeline
    );

    await uploadFilesToAzure(serviceURL, context, filesPath, files);

    const accountProps = await client.storageAccounts.getProperties(
        azureHostingConfig.azureHosting.resourceGroupName, azureHostingConfig.azureHosting.account);
    const endpoint = accountProps.primaryEndpoints && accountProps.primaryEndpoints.web;

    context.logger.info(
        chalk.green(`see your deployed site at ${ endpoint }`)
    );
    // TODO: log url for account at Azure portal
}

async function getFiles(context: BuilderContext, filesPath: string, projectRoot: string) {

    const files = await promisify(glob)(`/*`, {
        ignore: ['.git', '.azez.json'],
        root: filesPath,
        nodir: true,
        nomount: true
    });

    return files.map(file => {
        return file[0] === '/' ? file.slice(1) : file;
    });
}

export async function uploadFilesToAzure(
    serviceURL: ServiceURL,
    context: BuilderContext,
    filesPath: string,
    files: string[]
): Promise<void> {
    context.logger.info('preparing static deploy');
    const containerURL = ContainerURL.fromServiceURL(serviceURL, '$web');

    const bar = new ProgressBar({
        schema:
            '[:filled.brightGreen:blank] :current/:total files uploaded | :percent done | :elapseds | eta: :etas',
        total: files.length
    });

    bar.tick(0);

    await promiseLimit(5).map(files, async function(file: string) {
        const blobURL = BlobURL.fromContainerURL(containerURL, file);
        const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);

        const blobContentType = lookup(file) || '';
        const blobContentEncoding = charset(blobContentType) || '';

        await uploadStreamToBlockBlob(
            Aborter.timeout(30 * 60 * 60 * 1000),
            fs.createReadStream(path.join(filesPath, file)),
            blockBlobURL,
            4 * 1024 * 1024,
            20,
            {
                blobHTTPHeaders: {
                    blobContentType,
                    blobContentEncoding
                }
            }
        );

        bar.tick(1);
    });

    bar.clear();
    context.logger.info('deploying static site');
}
