/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export async function generateName(name: string, validate: (name: string) => Promise<boolean>) {
    let valid = false;
    do {
        valid = await validate(name);
        if (!valid) {
            name = `${ name }${ Math.ceil(Math.random() * 100) }`;
        }
    } while (!valid);
    return name;
}
