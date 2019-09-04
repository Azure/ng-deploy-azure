/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { StorageManagementClient } from '@azure/arm-storage';
import { newItemPrompt } from '../prompt/list';
import { Aborter, ServiceURL, SharedKeyCredential } from '@azure/storage-blob';
import { DeviceTokenCredentials } from '@azure/ms-rest-nodeauth';
import { AddOptions, Logger } from '../shared/types';
import { SchematicsException } from '@angular-devkit/schematics';
import { ResourceGroup } from './resource-group';
import { generateName } from '../prompt/name-generator';
import { spinner } from '../prompt/spinner';

const newAccountPromptOptions = {
  id: 'newAccount',
  message: 'Enter a name for the new storage account:',
  name: 'Create a new storage account',
  default: '',
  defaultGenerator: (name: string) => Promise.resolve(''),
  validate: (name: string) => Promise.resolve(true)
};

export function getAzureStorageClient(credentials: DeviceTokenCredentials, subscriptionId: string) {
  return new StorageManagementClient(credentials, subscriptionId);
}

export async function getAccount(
  client: StorageManagementClient,
  resourceGroup: ResourceGroup,
  options: AddOptions,
  logger: Logger
) {
  let accountName = options.account || '';
  let needToCreateAccount = false;

  spinner.start('Fetching storage accounts');
  // const accounts = await client.storageAccounts.listByResourceGroup(resourceGroup.name);
  const accounts = await client.storageAccounts;
  spinner.stop();

  function getInitialAccountName() {
    const normalizedProjectNameArray = options.project.match(/[a-zA-Z0-9]/g);
    const normalizedProjectName = normalizedProjectNameArray ? normalizedProjectNameArray.join('') : '';
    return `${normalizedProjectName}static`;
  }

  const initialName = getInitialAccountName();
  const generateDefaultAccountName = accountNameGenerator(client);
  const validateAccountName = checkNameAvailability(client, true);

  newAccountPromptOptions.default = initialName;
  newAccountPromptOptions.defaultGenerator = generateDefaultAccountName;
  newAccountPromptOptions.validate = validateAccountName;

  if (accountName) {
    const result = await accounts.checkNameAvailability(accountName);

    if (!result.nameAvailable) {
      // account exists
      // TODO: check account configuration
      logger.info(`Using existing account ${accountName}`);
    } else {
      // create account with this name, if valid
      const valid = await validateAccountName(accountName);
      if (!valid) {
        accountName = (await newItemPrompt(newAccountPromptOptions)).newAccount;
      }
      needToCreateAccount = true;
    }
  } else {
    // no account flag

    if (!options.manual) {
      // quickstart - create w/ default name

      accountName = await generateDefaultAccountName(initialName);
      const availableResult = await client.storageAccounts.checkNameAvailability(accountName);

      if (!availableResult.nameAvailable) {
        logger.info(`Account ${accountName} already exist on subscription`);
        logger.info(`Using existing account ${accountName}`);
      } else {
        needToCreateAccount = true;
      }
    }
  }

  if (needToCreateAccount) {
    spinner.start(`creating ${accountName}`);
    await createAccount(accountName, client, resourceGroup.name, resourceGroup.location);
    spinner.succeed();
  }

  return accountName;
}

function checkNameAvailability(client: StorageManagementClient, warn?: boolean) {
  return async (account: string) => {
    spinner.start();
    const availability = await client.storageAccounts.checkNameAvailability(account);
    if (!availability.nameAvailable && warn) {
      spinner.fail(availability.message || 'chosen name is not available');
    } else {
      spinner.stop();
    }
    return !!availability.nameAvailable;
  };
}

function accountNameGenerator(client: StorageManagementClient) {
  return async (name: string) => {
    return await generateName(name, checkNameAvailability(client, false));
  };
}

export async function setStaticSiteToPublic(serviceURL: ServiceURL) {
  await serviceURL.setProperties(Aborter.timeout(30 * 60 * 60 * 1000), {
    staticWebsite: {
      enabled: true,
      indexDocument: 'index.html',
      errorDocument404Path: 'index.html'
    }
  });
}

export async function getAccountKey(account: any, client: StorageManagementClient, resourceGroup: any) {
  const accountKeysRes = await client.storageAccounts.listKeys(resourceGroup, account);
  const accountKey = (accountKeysRes.keys || []).filter(key => (key.permissions || '').toUpperCase() === 'FULL')[0];
  if (!accountKey || !accountKey.value) {
    process.exit(1);
    return '';
  }
  return accountKey.value;
}

export async function createAccount(
  account: string,
  client: StorageManagementClient,
  resourceGroupName: string,
  location: string
) {
  const poller = await client.storageAccounts.beginCreate(resourceGroupName, account, {
    kind: 'StorageV2',
    location,
    sku: { name: 'Standard_LRS' }
  });
  await poller.pollUntilFinished();

  spinner.start('Retrieving account keys');
  const accountKey = await getAccountKey(account, client, resourceGroupName);
  if (!accountKey) {
    throw new SchematicsException('no keys retrieved for storage account');
  }
  spinner.succeed();

  spinner.start('Creating web container');
  await createWebContainer(client, resourceGroupName, account);
  spinner.succeed();
  const pipeline = ServiceURL.newPipeline(new SharedKeyCredential(account, accountKey));
  const serviceURL = new ServiceURL(`https://${account}.blob.core.windows.net`, pipeline);
  spinner.start('Setting container to be publicly available static site');
  await setStaticSiteToPublic(serviceURL);
  spinner.succeed();
}

export async function createWebContainer(client: StorageManagementClient, resourceGroup: any, account: any) {
  await client.blobContainers.create(resourceGroup, account, '$web', {
    publicAccess: 'Container',
    metadata: {
      cli: 'ng-deploy-azure'
    }
  });
}
