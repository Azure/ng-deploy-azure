/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { JsonObject } from '@angular-devkit/core';

export interface Logger {
    debug(message: string, metadata?: JsonObject): void;
    info(message: string, metadata?: JsonObject): void;
    warn(message: string, metadata?: JsonObject): void;
    error(message: string, metadata?: JsonObject): void;
    fatal(message: string, metadata?: JsonObject): void;
}

export interface AddOptions {
    project: string;
    manual?: boolean;
    subscriptionId?: string;
    subscriptionName?: string;
    resourceGroup?: string;
    account?: string;
    location?: string;
    'resource-allocation'?: boolean;
    config?: boolean;
    dry?: boolean;
    telemetry?: boolean;
    '--'?: string[];
}
