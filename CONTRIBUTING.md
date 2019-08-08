# Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
https://cla.microsoft.com.

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

1. Then, running `ng add @azure/ng-deploy` will use the locally linked version.

   ```sh
   ng add @azure/ng-deploy
   ```

1. Now you can deploy your angular app to azure.

   ```sh
   ng run your-angular-project:deploy
   ```

> You can remove the link later by running `npm unlink`

### Testing <a name="testing"></a>

Testing is done with [Jest](https://jestjs.io/). To run the tests:

```sh
npm run test:jest
```

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).

For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
