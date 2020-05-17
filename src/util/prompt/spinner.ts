/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as chalk from 'chalk';
const ora = require('ora');

export const spinner = ora({
  text: 'Rounding up all the reptiles',
  spinner: {
    frames: [chalk.red('▌'), chalk.green('▀'), chalk.yellow('▐'), chalk.blue('▄')],
    interval: 100,
  },
});

export function spin(msg?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function () {
      spinner.start(msg);
      let result;
      try {
        result = await originalMethod.apply(this, arguments);
      } catch (e) {
        spinner.fail(e);
      }
      spinner.succeed();
      return result;
    };
    return descriptor;
  };
}
