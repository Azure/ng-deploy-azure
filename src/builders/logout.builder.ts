/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { clearCreds } from '../util/azure/auth';

export default createBuilder<any>(
    async (builderConfig: any, context: BuilderContext): Promise<BuilderOutput> => {
        await clearCreds();
        context.logger.info('Cleared Azure credentials from cache.');
        return { success: true };
    }
);
