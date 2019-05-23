/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as inquirer from 'inquirer';

const fuzzy = require('fuzzy');

export interface PromptOptions {
    name?: string;
    message: string;
    default?: string;
    defaultGenerator?: ((name: string) => Promise<string>);
    title?: string;
    validate?: any;
    id: string;
}

export interface ListItem {
    name: string; // display name
    id?: string;
}

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

export async function filteredList(list: ListItem[], listOptions: PromptOptions, newItemOptions?: PromptOptions) {
    if (!list || list.length === 0) {
        return newItemOptions && newItemPrompt(newItemOptions);
    }

    const displayedList = newItemOptions ? [newItemOptions, ...list] : list;
    const result = await listPrompt(displayedList as ListItem[], listOptions.id, listOptions.message);

    if (newItemOptions && newItemOptions.id && result[listOptions.id].id === newItemOptions.id) {
        return newItemPrompt(newItemOptions);
    }
    return result;
}

export async function newItemPrompt(newItemOptions: PromptOptions) {
    let item, valid = true;
    const defaultValue =
        newItemOptions.defaultGenerator ?
            await newItemOptions.defaultGenerator(newItemOptions.default || '') :
            newItemOptions.default;
    do {
        item = await (inquirer as any).prompt({
            type: 'input',
            name: newItemOptions.id,
            default: defaultValue,
            message: newItemOptions.message
        });

        if (newItemOptions.validate) {
            valid = await newItemOptions.validate(item[newItemOptions.id]);
        }
    } while (!valid);

    return item;
}

export function listPrompt(list: ListItem[], name: string, message: string) {
    return (inquirer as any).prompt({
        type: 'autocomplete',
        name,
        source: searchList(list),
        message
    });
}

const isListItem = (elem: ListItem | { original: ListItem }): elem is ListItem => {
    return (<{ original: ListItem }>elem).original === undefined;
};

function searchList(list: ListItem[]) {
    return (_: any, input: string) => {
        return Promise.resolve(
            fuzzy
                .filter(input, list, {
                    extract(el: ListItem) {
                        return el.name;
                    }
                })
                .map((result: ListItem | { original: ListItem }) => {
                    let original: ListItem;
                    if (isListItem(result)) {
                        original = result;
                    } else {
                        original = result.original;
                    }
                    return { name: original.name, value: original };
                })
        );
    };
}
