# Protect class js
 
Creates a protected proxy class that restricts access to certain properties and allows viewing only of the class's public fields, including getters.

## Install

```bash
npm install protect-class
```

## Usage

```ts
import { protect } from 'protect-class';

class Foo {
  public bar: string = 'bar';
}

const cls = protect(Foo);
...

```

## Examples

#### Demonstration of the utility. In the following example, we will create a custom class:

```js
class Test {
  test1;
  test2 = {
    test4: undefined
  };
  #test3;
  
  get test3() {
      return this.#test3;
  }
  
  set test3(value) {
      this.#test3 = value;
  }
}
```

#### Let's see how an instance of the class behaves without protection:

```js
const cls = new Test();

console.log(Object.keys(cls));
// [ 'test1', 'test2' ]

console.log({...cls}); 
// { test1: undefined, test2: { test4: undefined } }

console.log({...Object.assign(cls, { test1: 'test1', test3: 'test3', test5: 'Hello' })}); 
// { test1: 'test1', test2: { test4: undefined }, test5: 'Hello' }

console.log(cls.test5); 
// Hello

console.log(JSON.stringify(cls)) 
// {"test1":"test1","test2":{},"test5":"Hello"}
```
As a result, we do not have the `test3` field in the output, but a new `test5` field has appeared :confused:

#### And with protection:

```js
const protect_cls = protect(new Test());

console.log(Object.keys(protect_cls));
// [ 'test1', 'test2', 'test3' ]

console.log({...protect_cls});
// { test1: undefined, test2: { test4: undefined }, test3: undefined }

console.log({...Object.assign(protect_cls, { test1: 'test1', test3: 'test3', test5: 'Hello' })});
// { test1: 'test1', test2: { test4: undefined }, test3: 'test3' }

console.log(protect_cls.test5);
// undefined

console.log(JSON.stringify(protect_cls))
// {"test1":"test1","test2":{},"test3":"test3"}
```

The protected instance outputs the getter key `test3` and when executing `Object.assign` did not add the new field `test5` :sunglasses:

## Options

`protect` - Creates a protected class proxy that restricts access to certain properties.

```js
const cls = protect(new Foo, {
  allowProtectedField: true,
  allowReadError: true,
  allowWriteError: true,
  disableDeleteError: true,
  disableCache: true
});
```

* `allowProtectedField`: *boolean* - *(default: false)* Allow access to protected fields (fields starting with "_").
* `allowReadError`: *boolean* - *(default: false)* Allow throwing an error when trying to access an unknown property.
* `allowWriteError`: *boolean* - *(default: false)* Allow throwing an error when trying to write to an unknown property.
* `disableDeleteError`: *boolean* - *(default: false)* Disable throwing an error when trying to delete a property.
* `disableCache`: *boolean* - *(default: false)* Disable caching of the enumerable getters.
