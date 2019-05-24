# @azure/ng-deploy

**Deploy Angular apps to Azure using the Angular CLI**

This Angular schematic helps you deploy your Angular app to Azure Static Hosting.
With Azure's Blob storage, deploying and hosting a static website is simple and cost-efficient.

Learn more about Azure Static Hosting in the
[blog post announcing Static websites on Azure Storage](https://azure.microsoft.com/en-us/blog/static-websites-on-azure-storage-now-generally-available/?WT.mc_id=ng_deploy_azure-github-cxa).

## Usage <a name="usage"></a>

### Quick-start

1. Create a new Angular project

```sh
ng new hello-world --defaults
cd hello-world
```

1. Add `ng-deploy` to your project

```sh
ng add @azure/ng-deploy
```

1. Deploy your project to Azure

```sh
ng run hello-world:deploy
```

### Requirements

To get started, you need:

- Angular app created and managed by the Angular CLI. For help getting started with a new Angular app, check out the [Angular CLI](https://cli.angular.io/).
- Azure subscription. If you don't have one, [create your Azure free account](https://azure.microsoft.com/en-us/free/?WT.mc_id=ng_deploy_azure-github-cxa).

The schematic runs from within an Angular project. Enter the project's directory and then follow these steps to add _ng deploy azure_ to your project, configure it, and deploy your app.

#### Step 1 - Angular CLI version 8 and above <a name="angular-cli-version"></a>

Run `ng --version`, make sure you have angular CLI version v8.0.0-beta.18 or greater.

If needed, update the CLI following the [instructions](https://www.npmjs.com/package/@angular/cli#updating-angular-cli).

**As long as version 8 is in RC, use `@next` instead of `@latest`:**

```sh
npm install -g @angular/cli@next
```

Update your project using the command:

```sh
ng update @angular/cli @angular/core --next=true

```

Make sure TypeScript is version 3.4.5 or greater.

#### Step 2 - add and configure @azure/ng-deploy <a name="ng-add"></a>

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

#### Step 3 - deploy <a name="deploy"></a>

Deploy your application to the selected storage account by running:

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

Please refer to [CONTRIBUTING](CONTRIBUTING.md) for CLA guidance.

First, clone the project.

Install the dependencies:

```sh
npm install
```

Build the project with watch:

```sh
npm start
```

-- or without watch:

```sh
npm run build
```

Create a local npm link:

```sh
npm link
```

### Adding to an Angular project - ng add <a name="local-dev-add"></a>

The schematic runs from within an Angular project. Enter the project's directory.

Follow the instructions for [checking and updating the Angular CLI version](#angular-cli-version).

Make sure TypeScript is version 3.4.5 or greater.

To add the local version of @azure/ng-deploy, link ng-deploy-azure:

```sh
npm link ng-deploy-azure
```

Then, instead of running `ng add @azure/ng-deploy`, add the local version:

```sh
ng add ng-deploy-azure
```

The [configuration options](#config) and the other commands (`deploy`, `logout`) are the same as in production:

```sh
ng run <project-name>:deploy
```

### Testing <a name="testing"></a>

Testing is done with [Jest](https://jestjs.io/). To run the tests:

```sh
npm run test:jest
```

## Reporting Security Issues <a name="issues"></a>

Security issues and bugs should be reported privately, via email, to the Microsoft Security Response Center (MSRC) at [secure@microsoft.com](mailto:secure@microsoft.com). You should receive a response within 24 hours. If for some reason you do not, please follow up via email to ensure we received your original message. Further information, including the [MSRC PGP](https://technet.microsoft.com/en-us/security/dn606155/?WT.mc_id=ng_deploy_azure-github-cxa) key, can be found in the [Security TechCenter](https://technet.microsoft.com/en-us/security/default/?WT.mc_id=ng_deploy_azure-github-cxa).

## We'd like to thank...

- [Minko Gechev](https://github.com/mgechev) for guiding us through the new Angular CLI Architect API, which enables adding commands.

- [Brian Holt](https://github.com/btholt) for creating [azez](https://github.com/btholt/azez), which provided us an (az)easy start.

- [John Papa](https://github.com/johnpapa) for guiding through and supporting the development, publish and release.
