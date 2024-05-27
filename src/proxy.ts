'use strict';

interface ProxyHandlerExt<T extends Object> extends ProxyHandler<T> {
  fields: Set<string>;
}

export interface IOptionsProtectedObject {
  allowProtectedField?: boolean;
  allowReadError?: boolean;
  allowWriteError?: boolean;
  disableDeleteError?: boolean;
  disableCache?: boolean;
};

export type IProtectedProxy = <T extends Object>(cls: T, options?: IOptionsProtectedObject) => T;

type ConstructorObject = { new (...args: any[]): {} };

const cacheFields = new Map<string, Set<string>>();

/**
 * Retrieves the fields of a class by caching them if possible.
 *
 * @param {T extends Object} cls - The class to retrieve the fields for.
 * @param {IOptionsProtectedObject} [options] - Options for protecting the class.
 * @return {Set<string>} The cached or computed fields of the class.
 */
const getFieldsByClass = <T extends Object>(cls: T, options?: IOptionsProtectedObject) => {
  return getFieldsFromCache(cls, options, () => setEnumerableGetters(cls));
}

/**
 * Retrieves a value from the cache if it exists, otherwise computes it using the provided function.
 *
 * @param {T extends Object} cls - The class to retrieve the value for.
 * @param {IOptionsProtectedObject | undefined} options - The options to use for caching.
 * @param {() => Set<string>} fn - The function to compute the value if it is not in the cache.
 * @return {Set<string>} The cached value or the computed value.
 */
const getFieldsFromCache = function <T extends Object>(cls: T, options: IOptionsProtectedObject | undefined, fn: () => Set<string>) {
  const name = cls.constructor?.name;
  const cache_name = `${name}_${JSON.stringify(options)}`;
  
  if (!name || name === 'Object' || options?.disableCache) {
      return fn();
  }
  
  if (!cacheFields.has(cache_name)) {
      cacheFields.set(cache_name, fn());
  }
  
  return cacheFields.get(cache_name) as Set<string>;
}

/**
 * Recursively sets the enumerable getters of a class and its prototype chain.
 *
 * @param {T} cls - The class to set the enumerable getters for.
 * @param {Set<string>} [fields=new Set()] - The set of fields to add the enumerable getters to.
 * @return {Set<string>} - The set of fields with the enumerable getters added.
 */
const setEnumerableGetters = <T extends Object>(cls: T, fields: Set<string> = new Set()) => {
  const p = Object.getPrototypeOf(cls);
  if (!Object.getPrototypeOf(p)) {
    return fields;
  }
    
  fields = setEnumerableGetters(p, fields);
  Object.keys(cls).forEach(fields.add, fields);

  for(const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(p))) {
    if (typeof descriptor.get === 'function') {
      fields.add(key);
    }
  }

  return fields;
};

const createProxy = <T extends Object>(cls: T, fields: Set<string>, options?: IOptionsProtectedObject) => {
  const isAllowProtectedField = (key: string) => {
    return !!options?.allowProtectedField || !key.startsWith('_');
  };
  
  const handler: ProxyHandlerExt<T> = {
    fields: new Set([...fields].filter(key => isAllowProtectedField(key))),
    get(target: any, prop: string) {
      //console.log('Proxy::get', prop, target);
      if (prop in target && isAllowProtectedField(prop) && !prop.startsWith('#')) {
        let value = Reflect.get(target, prop);
        return typeof value == 'function' ? value.bind(target) : value;
      } else if (options?.allowReadError) {
        throw new TypeError("Access denied");
      } else{
        return undefined;
      }
    },
    set(target: any, prop: string, value: any) {
      // console.log('Proxy::set', prop);
      if (this.fields.has(prop)) {
        Reflect.set(target, prop, value);
      } else if (options?.allowWriteError) {
        throw new TypeError("Access denied");
      }

      return true;
    },
    ownKeys(target) {
      // console.log('Proxy::ownKeys', [...this.fields]);
      return [...this.fields];
    },
    getOwnPropertyDescriptor(target, prop: string) {
      // console.log('Proxy::getOwnPropertyDescriptor', Object.getOwnPropertyDescriptor(target, prop));
      
      if (!this.fields.has(prop)) {
        return Object.getOwnPropertyDescriptor(target, prop);
      }

      return {
        ...Object.getOwnPropertyDescriptor(target, prop),
        enumerable: true,
        configurable: true
      };
    },
    deleteProperty(target, prop) {
      if (!options?.disableDeleteError) {
        throw new TypeError("Access denied");
      }

      return true;
    },
  };

  return new Proxy(cls, handler);
}

/**
 * Creates a protected class proxy that restricts access to certain properties.
 *
 * @param {T extends Object} cls - The class to be protected.
 * @param {IOptionsProtectedObject} [options] - Options for protecting the class.
 * @param {boolean} [options.allowProtectedField] - Allow access to protected fields (fields starting with "_").
 * @param {boolean} [options.allowReadError] - Allow throwing an error when trying to access an unknown property.
 * @param {boolean} [options.allowWriteError] - Allow throwing an error when trying to write to an unknown property.
 * @param {boolean} [options.disableDeleteError] - Disable throwing an error when trying to delete a property.
 * @param {boolean} [options.disableCache] - Disable caching of the enumerable getters.
 * @return {Proxy<T>} The protected class proxy.
 */
export const protect: IProtectedProxy = <T extends Object>(cls: T, options?: IOptionsProtectedObject) => {
  const fields = getFieldsByClass(cls, options);

  return createProxy(cls, fields, options);
};

/**
 * Returns a decorator function that creates a protected class proxy.
 *
 * @param {Partial<IOptionsProtectedObject>} [options] - Options for protecting the class.
 * @param {boolean} [options.allowProtectedField] - Allow access to protected fields (fields starting with "_").
 * @param {boolean} [options.allowReadError] - Allow throwing an error when trying to access an unknown property.
 * @param {boolean} [options.allowWriteError] - Allow throwing an error when trying to write to an unknown property.
 * @param {boolean} [options.disableDeleteError] - Disable throwing an error when trying to delete a property.
 * @param {boolean} [options.disableCache] - Disable caching of the enumerable getters.
 * @return {(target: T, context: ClassDecoratorContext) => any} - The decorator function.
 */
export function Protect(options?: IOptionsProtectedObject) {
  return function<T extends ConstructorObject>(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      const cls = new target;
      const fields = getFieldsByClass(cls, options as IOptionsProtectedObject);

      return new Proxy(target, {
        construct(target, args) {
          return createProxy(Reflect.construct(target, args) as T, fields, options as IOptionsProtectedObject);
        },
      });
    }

    throw new TypeError("Wrong data type, must be a class");
  }
}