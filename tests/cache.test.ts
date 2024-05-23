import {describe, expect, test} from '@jest/globals';
import { Test } from './data';

const durationRun = (fn: () => void) => {
  const start = new Date().getTime();
  fn();
  const end = new Date().getTime();

  return (end - start) / 1000;
};


describe('cache', () => {

  test('Many identical objects of the same class', () => {
    const count_instances = 10000;

    const ms_no_cache = durationRun(() => {
      for (let i = 0; i < count_instances; i++) {
        const instance = Test.create({ disableCache: true });
      }
    });

    const ms_cache = durationRun(() => {
      for (let i = 0; i < count_instances; i++) {
        const instance = Test.create();
      }
    });

    expect(ms_cache).toBeLessThan(ms_no_cache);
  });
});