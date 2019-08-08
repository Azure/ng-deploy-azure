/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { getLocation } from '../locations';

describe('location', () => {
  test('should return undefined when locationName is undefined', () => {
    const actual = getLocation(undefined);
    expect(actual).toBeUndefined();
  });

  test('should return matched location', () => {
    const actual = getLocation('southafricanorth');
    expect(actual && actual.id).toBe('southafricanorth');
    expect(actual && actual.name).toBe('South Africa North');
  });
});
