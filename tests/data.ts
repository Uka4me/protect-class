import { protect } from '../src/index';
import { IOptionsProtectedObject } from '../src/proxy';

export class Test2 {
  test3: any = undefined;
  test6: any = {
    test7: undefined
  };
  #test4: any = undefined;
  
  get test4() {
      return this.#test4;
  }
  
  set test4(value) {
      this.#test4 = value;
  }
}

export class Test extends Test2 {
  test1: any = undefined;
  _test4: any = '_test4';
  #test2: any = undefined;
  #test5: any = undefined;

  constructor() {
      super();
  }

  static create(options?: IOptionsProtectedObject) {
    return protect(new this(), options);
  }
  
  get test2() {
      return this.#test2;
  }
  
  set test2(value) {
      this.#test2 = value;
  }
  
  get test4() {
      return this.#test5;
  }
  
  set test4(value) {
      this.#test5 = value + 100;
  }
  
  func1() {
      return this.test1;
  }

  func2() {
    return this.#test2;
  }

  func3(num: any) {
    return num;
  }

  func4() {
    return this._test4;
  }
}