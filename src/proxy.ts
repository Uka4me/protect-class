/**
 * Recursively sets the enumerable getters of a class and its prototype chain.
 *
 * @param {T} cls - The class to set the enumerable getters for.
 * @param {Set<string>} [fields=new Set()] - The set of fields to add the enumerable getters to.
 * @return {Set<string>} - The set of fields with the enumerable getters added.
 */
const setEnumerableGetters = <T>(cls: T, fields: Set<string> = new Set()) => {
  const p = Object.getPrototypeOf(cls);
  if (!Object.getPrototypeOf(p)) {
      return fields;
  }
    
  setEnumerableGetters(p);

  for(const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(p))) {
      if (typeof descriptor.get === 'function') {
        fields.add(key);
      }
  }

  return fields;
};

interface ProxyHandlerExt<T extends Object> extends ProxyHandler<T> {
  fields: Set<string>;
}

export interface IOptionsProtectedObject {
  allowProtectedField?: boolean;
  allowReadError?: boolean;
  allowWriteError?: boolean;
  disableDeleteError?: boolean;
};

export type IProtectedObject = <T extends Object>(cls: T, options?: IOptionsProtectedObject) => T;

/**
 * Creates a protected class proxy that restricts access to certain properties.
 *
 * @param {T extends Object} cls - The class to be protected.
 * @param {IOptionsProtectedObject} [options] - Options for protecting the class.
 * @param {boolean} [options.allowProtectedField] - Allow access to protected fields (fields starting with "_").
 * @param {boolean} [options.allowReadError] - Allow throwing an error when trying to access an unknown property.
 * @param {boolean} [options.allowWriteError] - Allow throwing an error when trying to write to an unknown property.
 * @param {boolean} [options.disableDeleteError] - Disable throwing an error when trying to delete a property.
 * @return {Proxy<T>} The protected class proxy.
 */
const protectedClass: IProtectedObject = <T extends Object>(cls: T, options?: IOptionsProtectedObject) => {
  const isAllowProtectedField = (key: string) => {
    return !!options?.allowProtectedField || !key.startsWith('_');
  };

  const handler: ProxyHandlerExt<T> = {
    fields: setEnumerableGetters(cls, new Set(Object.keys(cls).filter(key => isAllowProtectedField(key)))),
    get(target: any, prop: string) {
      //console.log('Proxy::get', prop, target);
      if (prop in target && isAllowProtectedField(prop) && !prop.startsWith('#')) {
        let value = Reflect.get(target, prop);
        return typeof value == 'function' ? value.bind(target) : value;
      } else if (options?.allowReadError) {
        throw new Error("Access denied");
      } else{
        return undefined;
      }
    },
    set(target: any, prop: string, value: any) {
      // console.log('Proxy::set', prop);
      if (this.fields.has(prop)) {
        Reflect.set(target, prop, value);
      } else if (options?.allowWriteError) {
        throw new Error("Access denied");
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
        throw new Error("Access denied");
      }

      return true;
    },
  };

  return new Proxy(cls, handler);
};

export default protectedClass;