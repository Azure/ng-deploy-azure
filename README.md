# @azure/ng-deploy

**Deploy Angular apps to Azure using the Angular CLI**

`@azure/ng-deploy` helps you deploy your Angular app to Azure Static Hosting.

## Usage <a name="usage"></a>

> The package is not yet available in npm. Please refer to the [local development](local-dev) section of this document to clone, link and add the package to an existing Angular project.

### Quick-start

1. Install the next version of the Angular CLI (v8.0.0-beta.18 or greater).

   ```sh
   npm install -g @angular/cli@next
   ```

1. Create a new Angular project

   ```sh
   ng new hello-world --defaults
   cd hello-world
   ```

1. Add `ng-deploy` to your project and create your Azure blob storage resources.

   ```sh
   ng add @azure/ng-deploy@beta
   ```

1. You may be prompted you to sign in to Azure, providing a link to open in your browser and a code to paste in the login page.

1. Build your Angular app

   ```sh
   ng build --prod
   ```

1. Deploy your project to Azure

   ```sh
   ng run hello-world:deploy
   ```

### Requirements

You will need the Angular CLI, an Angular project, and an Azure Subscription to deploy to Azure. Details of these requirements are in this section.

#### Azure

If you don't have an Azure subscription, [create your Azure free account](https://azure.microsoft.com/en-us/free/?WT.mc_id=ng_deploy_azure-github-cxa).

#### Angular CLI <a name="angular-cli"></a>

1. Install the next version of the Angular CLI (v8.0.0-beta.18 or greater).

   ```sh
   npm install -g @angular/cli@next
   ```

   > As long as version 8 is in RC, use `@next` instead of `@latest`

1. Run `ng --version`, make sure you have angular CLI version v8.0.0-beta.18 or greater.

1. If need instructions to update the CLI, [follow these upgrade instructions](https://www.npmjs.com/package/@angular/cli#updating-angular-cli).

1. Update your project using the command:

   ```sh
   ng update @angular/cli @angular/core --next=true
   ```

#### An Angular App Created by the Angular CLI

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
ng run <project-name>:logout
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

## Local development <a name="local-dev"></a>

If you want to try the latest package locally without installing it from npm, use the following instructions. This may be useful when you want to try the latest non published version of this library or you want to make a contribution.

Follow the instructions for [checking and updating the Angular CLI version](#angular-cli). Also, verify your of TypeScript is version 3.4.5 or greater.

### npm link

Use the following instructions to make ng-deploy-azure available locally via `npm link`.

1. Clone the project

   ```sh
   git clone git@github.com:Azure/ng-deploy-azure.git
   cd ng-deploy-azure
   ```

1. Install the dependencies

   ```sh
   npm install
   ```

1. Build the project:

   ```sh
   npm run build
   ```

1. Create a local npm link:

   ```sh
   npm link
   ```

### Adding to an Angular project - ng add <a name="local-dev-add"></a>

Once you have completed the previous steps to npm link the local copy of ng-deploy-azure, follow these steps to use it in a local angular project.

1. Enter the project's directory

   ```sh
   cd your-angular-project
   ```

1. To add the local version of @azure/ng-deploy, link ng-deploy-azure.

   ```sh
   npm link ng-deploy-azure
   ```

1. You may be prompted you to sign in to Azure, providing a link to open in your browser and a code to paste in the login page.

1. Then, instead of running `ng add @azure/ng-deploy`, add the local version.

   ```sh
   ng add ng-deploy-azure
   ```

1. Now you can deploy your angular app to azure.

   ```sh
   ng run your-angular-project:deploy
   ```

### Testing <a name="testing"></a>

Testing is done with [Jest](https://jestjs.io/). To run the tests:

```sh
npm run test:jest
```

## Reporting Security Issues <a name="issues"></a>

Security issues and bugs should be reported privately, via email, to the Microsoft Security Response Center (MSRC) at [secure@microsoft.com](mailto:secure@microsoft.com). You should receive a response within 24 hours. If for some reason you do not, please follow up via email to ensure we received your original message. Further information, including the [MSRC PGP](https://technet.microsoft.com/en-us/security/dn606155/?WT.mc_id=ng_deploy_azure-github-cxa) key, can be found in the [Security TechCenter](https://technet.microsoft.com/en-us/security/default/?WT.mc_id=ng_deploy_azure-github-cxa).

## Contributing

Please refer to [CONTRIBUTING](CONTRIBUTING.md) for CLA guidance.

## Thank You

- [Minko Gechev](https://github.com/mgechev) for guiding us through the new Angular CLI Architect API, which enables adding commands.

- [Brian Holt](https://github.com/btholt) for creating [azez](https://github.com/btholt/azez), which provided us an (az)easy start.

- [John Papa](https://github.com/johnpapa) for guiding through and supporting the development, publish and release.

## Resources

- Learn more about Azure Static Hosting in this [blog post announcing Static websites on Azure Storage](https://azure.microsoft.com/en-us/blog/static-websites-on-azure-storage-now-generally-available/?WT.mc_id=ng_deploy_azure-github-cxa).
