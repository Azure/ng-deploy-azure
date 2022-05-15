/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { prompt } from 'inquirer';

export async function confirm(message: string, confirmByDefault: boolean = false): Promise<boolean> {
  const { ok } = await prompt<{ ok: any }>([
    {
      type: 'confirm',
      name: 'ok',
      default: confirmByDefault,
      message,
    },
  ]);
  return ok;
}
