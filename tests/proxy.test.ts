import {describe, expect, test} from '@jest/globals';
import { Test } from './data';


describe('proxy', () => {
  test('Stucture new class', () => {
    const instance = Test.create();

    instance.test1 = 1;
    instance.test2 = 2;

    // @ts-ignore: Simulating dynamic field creation
    instance.testNew = 'new';
    instance._test4 = 'test4';

    const obj = { ...instance };
    expect(obj).toStrictEqual({
      "test1": 1,
      "test2": 2,
      "test3": undefined,
      "test4": undefined,
      "test6": {
        "test7": undefined
      }
    });

    instance.test6.test7 = 7;
    expect(instance.test6.test7).toBe(7);

    expect(instance.func1()).toBe(1);
    expect(instance.func2()).toBe(2);
    expect(instance.func3(3)).toBe(3);
    expect(instance.func4()).toBe('_test4');
  });

  test('Read field not exist, no error', () => {
    const instance = Test.create();

    const t = () => {
      // @ts-ignore: Simulating dynamic field creation
      const data = instance.testNew;
      instance.test1 = data;
    };
    expect(t).not.toThrow(Error);
  });

  test('Read field not exist, error', () => {
    const instance = Test.create({
      allowReadError: true
    });

    const t = () => {
      // @ts-ignore: Simulating dynamic field creation
      const data = instance.testNew;
      instance.test1 = data;
    };
    expect(t).toThrow(Error);
  });

  test('Write new fields, no error', () => {
    const instance = Test.create();

    const t = () => {
      // @ts-ignore: Simulating dynamic field creation
      instance.testNew = 'new';
    };
    expect(t).not.toThrow(Error);

    const p = () => {
      instance._test4 = 'test4';
    };
    expect(p).not.toThrow(Error);
  });

  test('Write new fields, error', () => {
    const instance = Test.create({
      allowWriteError: true
    });

    const t = () => {
      // @ts-ignore: Simulating dynamic field creation
      instance.testNew = 'new';
    };
    expect(t).toThrow(Error);

    const p = () => {
      instance._test4 = 'test4';
    };
    expect(p).toThrow(Error);
  });

  test('Delete field, error', () => {
    const instance = Test.create();

    const t = () => {
      delete instance.test1;
    };
    expect(t).toThrow(Error);
  });

  test('Delete field, no error', () => {
    const instance = Test.create({
      disableDeleteError: true
    });

    const t = () => {
      delete instance.test1;
    };
    expect(t).not.toThrow(Error);
  });

  test('Protected field', () => {
    const instance = Test.create({
      allowProtectedField: true
    });

    instance._test4 = 'test4';
    
    const obj = { ...instance };
    expect(obj).toStrictEqual({
      "test1": undefined,
      "test2": undefined,
      "test3": undefined,
      "test4": undefined,
      "_test4": 'test4',
      "test6": {
        "test7": undefined
      }
    });
  });
});