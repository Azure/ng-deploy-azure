#!/bin/bash

# Simple e2e testing script
# Usage: ./test.sh [subscription_name]

set -e

AZURE_SUBSCRIPTION=${1:'ca-yolasors-demo-test'}
AZURE_RESOURCE_GROUP='ci-azure-ng-deploy'
AZURE_STORAGE='ciazurengdeploy'
CWD=`pwd`
TEST_FOLDER="$CWD/.e2e-tests"

function cleanup() {
    cd "$CWD"
    rm -rf "$TEST_FOLDER"
}

# Cleanup test folder in case of error
trap cleanup ERR

mkdir -p "$TEST_FOLDER"
cd "$TEST_FOLDER"

echo
echo -------------------------------------------------------------------------------
echo Creating new Angular project to deploy on Azure
echo -------------------------------------------------------------------------------
echo

# TODO: manage @azure/ng-deploy + az cli login on CI

npm pack ..
ng new sample-app --routing true --style css
cd sample-app
npm i -D ../azure-ng-deploy*.tgz
ng add @azure/ng-deploy -m true -n $AZURE_SUBSCRIPTION -g $AZURE_RESOURCE_GROUP -a $AZURE_STORAGE -l "westus" --telemetry false
ng build --prod
ng run sample-app:deploy
cd "$CWD"
rm -rf "$TEST_FOLDER"

# Cleanup resource group using az cli
az.cmd group delete -n $AZURE_RESOURCE_GROUP -y
