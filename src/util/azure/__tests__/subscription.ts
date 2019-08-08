/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { selectSubscription } from '../subscription';
import { LinkedSubscription } from '@azure/ms-rest-nodeauth';
import { AddOptions } from '../../shared/types';

jest.mock('inquirer');

// AddOptions, Logger

const SUBID = '124';
const SUBNAME = 'name';

const optionsMock = <AddOptions>{
  subscriptionId: SUBID,
  subscriptionName: SUBNAME
};

// const optionsMockEmpty = <AddOptions>{};

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn()
};

// TODO check loggerMack for calls and args, need to reset mock before every test though
// mockReset()

describe('subscription', () => {
  beforeEach(() => {
    loggerMock.warn.mockClear();
  });

  test('should throw error when input is an EMPTY array', async () => {
    const errorMessage =
      "You don't have any active subscriptions. " +
      'Head to https://azure.com/free and sign in. From there you can create a new subscription ' +
      'and then you can come back and try again.';

    expect(selectSubscription([], optionsMock, loggerMock)).rejects.toEqual(new Error(errorMessage));
  });

  test('provided sub id DOES NOT match when provided in options', async () => {
    const subs = <Array<LinkedSubscription>>[
      {
        id: '456',
        name: 'a sub'
      }
    ];

    selectSubscription(subs, optionsMock, loggerMock);

    const warnCalledTwice = loggerMock.warn.mock.calls.length === 2;

    expect(loggerMock.warn.mock.calls[0][0]).toBe(`The provided subscription ID does not exist.`);
    expect(loggerMock.warn.mock.calls[1][0]).toBe(`Using subscription ${subs[0].name} - ${subs[0].id}`);
    expect(warnCalledTwice).toBeTruthy();
  });

  test('should return first subscriptions id, if only ONE subscription', async () => {
    const singleSubscription = { id: SUBID, name: SUBNAME };

    const subs = <Array<LinkedSubscription>>[singleSubscription];
    const actual = await selectSubscription(subs, optionsMock, loggerMock);
    const warnNotCalled = loggerMock.warn.mock.calls.length === 0;

    expect(warnNotCalled).toBeTruthy();
    expect(actual).toEqual(singleSubscription.id);
  });

  test('should throw error when input is undefined', async () => {
    const errorMessage =
      'API returned no subscription IDs. It should. ' +
      "Log in to https://portal.azure.com and see if there's something wrong with your account.";

    // this one looks a bit weird because method is `async`, otherwise throwError() helper should be used
    expect(selectSubscription(undefined, optionsMock, loggerMock)).rejects.toEqual(new Error(errorMessage));
  });

  test('should prompt user to select a subscription if more than one subscription', async () => {
    const expected = 'subMock'; // check inquirer.js at __mocks__ at root level

    const subs = <Array<LinkedSubscription>>[{ id: 'abc', name: 'subMock' }, { id: '123', name: 'sub2' }];
    const actual = await selectSubscription(subs, optionsMock, loggerMock);

    // TODO verify that prompt is being invoked

    expect(actual).toEqual(expected);
  });
});
