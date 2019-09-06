# @azure/ng-deploy

[![npm version](https://badge.fury.io/js/%40azure%2Fng-deploy.svg)](https://www.npmjs.com/package/@azure/ng-deploy)
[![Build Status](https://dev.azure.com/devrel/chris-noring-test/_apis/build/status/Azure.ng-deploy-azure?branchName=master)](https://dev.azure.com/devrel/chris-noring-test/_build/latest?definitionId=19&branchName=master)
[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?color=blue&style=flat-square)](http://opensource.org/licenses/MIT)

**Deploy Angular apps to Azure using the Angular CLI**

`@azure/ng-deploy` helps you deploy your Angular app to Azure Static Hosting using the [Angular CLI](https://angular.io/cli).

## Quick-start <a name="quickstart"></a>

1. Install the Angular CLI (v8 or greater) and create a new Angular project.

   ```sh
   npm install -g @angular/cli
   ng new hello-world --defaults
   cd hello-world
   ```

1. Add `ng-deploy` to your project and create your Azure blob storage resources.

   ```sh
   ng add @azure/ng-deploy
   ```

1. You may be prompted you to sign in to Azure, providing a link to open in your browser and a code to paste in the login page.

1. Build your Angular app.

   ```sh
   ng build --prod
   ```

1. Deploy your project to Azure.

   ```sh
   ng run hello-world:deploy
   ```

You will see output similar to the following. Browse to the link and view your site running in Azure blob storage!

```sh
see your deployed site at https://helloworldstatic52.z22.web.core.windows.net/
```

## Requirements

You will need the Angular CLI, an Angular project, and an Azure Subscription to deploy to Azure. Details of these requirements are in this section.

### Azure

If you don't have an Azure subscription, [create your Azure free account from this link](https://azure.microsoft.com/en-us/free/?WT.mc_id=ng_deploy_azure-github-cxa).

### Angular CLI <a name="angular-cli"></a>

1. Install the Angular CLI (v8 or greater).

   ```sh
   npm install -g @angular/cli
   ```

1. Run `ng --version`, make sure you have angular CLI version v8.0.0 or greater.

1. If need instructions to update the CLI, [follow these upgrade instructions](https://www.npmjs.com/package/@angular/cli#updating-angular-cli).

1. Update your project using the command:

   ```sh
   ng update @angular/cli @angular/core
   ```

### An Angular App Created by the Angular CLI

You will need an Angular app created and managed by the Angular CLI. For help getting started with a new Angular app, check out the [Angular CLI](https://cli.angular.io/).

A simple app can be created with `ng new hello-world --defaults`

Verify you have TypeScript version 3.4.5 or greater in your `package.json` file of your angular project

## Details of ng-azure-deploy

### How to add and configure @azure/ng-deploy <a name="ng-add"></a>

Add _@azure/ng-deploy_ to your project by running:

```sh
ng add @azure/ng-deploy
```

This command will install the package to your project.

Once done, it will prompt you to sign in to Azure, providing a link to open in your browser and a code to paste in the login page.

After you sign in, it will create the needed resources in your Azure account (resource group and storage account) and configure them for static hosting. To manually configure the resources that will be used, refer to [additional options](#additional options).

_Note: If you have several Azure subscriptions you will be asked to choose one._

The command will create the file `azure.json` with the deployment configuration and modify `angular.json` with the deploy commands.

_Note: at the moment, the command will fail if an `azure.json` file already exists. Please remove the file before running the command._

### deploy <a name="deploy"></a>

You can deploy your application to the selected storage account by running the following command.

```sh
ng run <project-name>:deploy
```

If the build target (`dist/<project-name>` folder) is empty, the project will be built with the production option (similar to running `ng build --prod`).

You may be asked to sign in to Azure again. Then, the project will be deployed to the storage account specified in `azure.json`. The link to the deployed app will be presented.

### Logging out from Azure <a name="logout"></a>

To clear the cached credentials run:

```sh
ng run <project-name>:azureLogout
```

This command is available only after signing in to Azure.

## Data/Telemetry <a name="telemetry"></a>

This project collects usage data and sends it to Microsoft to help improve our products and services.

Read Microsoft's [privacy statement](https://privacy.microsoft.com/en-gb/privacystatement/?WT.mc_id=ng_deploy_azure-github-cxa) to learn more.

To turn off telemetry, add the telemetry flag (`--telemetry` or `-t`) with the `false` value when running `ng add`, like this:

```sh
ng add ng-deploy-azure --telemetry=false
```

or

```sh
ng add ng-deploy-azure -t=false
```

### Additional options <a name="options"></a>

#### Manual configurations <a name="manual"></a>

To manually select and/or create the resources needed for deployment,
use the `--manual` (or `-m`) option:

```sh
ng add @azure/ng-deploy --manual
```

You will be prompted to select or create the resource group and the storage account
in which the app will be deployed. If you choose to create a resource group
you will be asked to select the geographical location.

#### Passing configuration options <a name="config"></a>

You can pass the names of the resources you'd like to use when running the command.
Resources that don't already exist will be created.
If using `--manual` you will be prompted to select the remaining configuration options.
Otherwise, defaults will be used.

The available options are:

- `--subscriptionId` (`-i`) - subscription ID under which to select and/or create new resources
- `--subscriptionName` (`-n`) - subscription name under which to select and/or create new resources
- `--resourceGroup` (`-g`) - name of the Azure Resource Group to deploy to
- `--account` (`-a`) - name of the Azure Storage Account to deploy to
- `--location` (`-l`) - location where to create storage account e.g. `"West US"` or `westus`
- `--telemetry` (`-t`) - see [Data/Telemetry](#telemetry)

Example:

```sh
ng add @azure/ng-deploy -m -l="East US" -a=myangularapp
```

#### Name validation <a name="name-validation"></a>

When creating a new storage account, the provided name will be validated.

The requirements for these names are:

- between 3 and 24 characters
- lower case letters and numbers only
- unique across Azure

If the validation fails, the tool will suggest a valid name. You will be able to select it or try another one.

## Continuous Integration Mode <a name="ci"></a>

When deploying from a CI environement, we switch to a non-interactive login process that requires you to provide [Service Principal][principal-service] crendetials as environment variables. A [Service Principal][principal-service] is an application within [Azure Active Directory][active-directory] that we can use to perform unattended resource and service level operations.

### Creating a Service Principal <a name="sp"></a>

In orther to create and get the [Service Principal][principal-service] application credentials, you can either use the [Azure Portal][principal-service-portal] or use the [Azure CLI][azure-cli].

We recommend using the Azure CLI and running the following command:

```sh
AZURE_SUBSCRIPTION_ID="<a valid subscription ID>"
SP_NAME='<a principal service name>'
az ad sp create-for-rbac --role="Contributor" --scopes="/subscriptions/$AZURE_SUBSCRIPTION_ID" --name="$SP_NAME"
```

This command will output the following values:

```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "displayName": "<the principal service name>",
  "name": "http://<the principal service name>",
  "password": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenant": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

You can use the Azure CLI to test that these values work and you can logging in:

```sh
az login --service-principal -u $CLIENT_ID -p $CLIENT_SECRET --tenant $TENANT_ID
```

### Configuring the environment variables

We will need to set the following environment variables BEFORE adding `@azure/ng-deploy` or running the deploy command:

- `CI`: this must be set to `1`. This will enable the CI mode.
- `CLIENT_ID`: is the `appId` created above.
- `CLIENT_SECRET`: is the `password` created above.
- `TENANT_ID`: is the `tenant` created above.
- `AZURE_SUBSCRIPTION_ID`: is your valid subscription ID.

Here is a simple shell example:

```sh
export CI=1
export CLIENT_ID='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
export CLIENT_SECRET='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
export TENANT_ID='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
export AZURE_SUBSCRIPTION_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
ng run <project-name>:deploy
```

> For security reasons, we highly recommend to create and provide these environment variables through a different method, eg. [Github Secrets][github-secrets] or [Azure DevOps Secrets][azure-devops-secrets].

## Reporting Security Issues <a name="issues"></a>

Security issues and bugs should be reported privately, via email, to the Microsoft Security Response Center (MSRC) at [secure@microsoft.com](mailto:secure@microsoft.com). You should receive a response within 24 hours. If for some reason you do not, please follow up via email to ensure we received your original message. Further information, including the [MSRC PGP](https://technet.microsoft.com/en-us/security/dn606155/?WT.mc_id=ng_deploy_azure-github-cxa) key, can be found in the [Security TechCenter](https://technet.microsoft.com/en-us/security/default/?WT.mc_id=ng_deploy_azure-github-cxa).

## Contributing

Please refer to [CONTRIBUTING](CONTRIBUTING.md) for CLA guidance.

## Thank You

- [Minko Gechev](https://twitter.com/mgechev) for guiding us through the new Angular CLI Architect API, which enables adding commands.

- [Brian Holt](https://twitter.com/holtbt) for creating [azez](https://github.com/btholt/azez), which provided us an (az)easy start.

- [John Papa](https://twitter.com/john_papa) for guiding through and supporting the development, publish and release.

## Related Resources

- Learn more about Azure Static Hosting in this [blog post announcing Static websites on Azure Storage](https://azure.microsoft.com/en-us/blog/static-websites-on-azure-storage-now-generally-available/?WT.mc_id=ng_deploy_azure-github-cxa)
- Install this [VS Code extension for Azure Storage](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestorage&WT.mc_id=ng_deploy_azure-github-cxa)
- Follow this tutorial to [deploy a static website to Azure](https://code.visualstudio.com/tutorials/static-website/getting-started?WT.mc_id=ng_deploy_azure-github-cxa)
- [azure-cli](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest?WT.mc_id=ng_deploy_azure-github-cxa)
- [active-directory](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-whatis?WT.mc_id=ng_deploy_azure-github-cxa)
- [principal-service](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals?WT.mc_id=ng_deploy_azure-github-cxa)
- [principal-service-portal](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal?WT.mc_id=ng_deploy_azure-github-cxa)
- [azure-devops-secrets](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch#secret-variables?WT.mc_id=ng_deploy_azure-github-cxa)
- [github-secrets](https://help.github.com/en/articles/virtual-environments-for-github-actions#environment-variables)
