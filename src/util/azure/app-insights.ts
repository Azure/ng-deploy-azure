/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export function startInsights(insightsKey: string, isProd = false) {
  const appInsights = require('applicationinsights');
  if (!insightsKey) {
    if (isProd) {
      console.error('App Insights key is missing');
    }
    return;
  }
  appInsights.setup(insightsKey);
  appInsights.start();
}
