import innerLooper from './utils/innerLooper';
import { isValidObject } from './utils/typeCheckers';
import { LOOP, DEFAULTS } from './constants';
import { Options, Iterable } from './interfaces';

export default function traversalMap(
  collection: Iterable,
  callbackFn: Function,
  options?: Options
) {
  if (options) {
    // If it doesn't throw it means that the options were valid
    validateOptions(options);
  } else {
    options = {};
  }

  const SETTINGS = { ...DEFAULTS, ...options };

  forEachLoop(
    collection,
    callbackFn,
    '',
    SETTINGS,
    Array.isArray(collection),
    isValidObject(collection)
  );
}

function forEachLoop(
  value: any,
  fn: Function,
  path: string,
  settings: Options,
  valueIsArray: boolean,
  valueIsPlainObject: boolean
) {
  let loopReturnCode;

  if (valueIsArray || valueIsPlainObject) {
    innerLooper(value, (childValue, keyOrIndex, parentCollection) => {
      let deepPath;
      if (valueIsArray) {
        deepPath = `${path}[${keyOrIndex}]`;
      } else if (valueIsPlainObject) {
        if (settings.useDotNotationOnKeys) {
          deepPath = path ? `${path}.${keyOrIndex}` : keyOrIndex;
        } else {
          deepPath = `${path}['${keyOrIndex}']`;
        }
      }

      const shoudSkipFnCall =
        settings.skipNodes &&
        childValue !== null &&
        typeof childValue === 'object';

      let fnReturnCode;
      if (!shoudSkipFnCall) {
        fnReturnCode = fn.call(
          parentCollection,
          childValue,
          keyOrIndex,
          deepPath
        );
      }

      if (fnReturnCode === LOOP.BREAK_CURRENT) {
        return false;
      } else if (fnReturnCode === LOOP.BREAK_ALL) {
        loopReturnCode = fnReturnCode;
        return false;
      }

      /*
       * This is necesary because calling the `fn` may have changed the value.
       * For example if you dont return the value in the `fn` here it will be undefined.
       */
      let childValuePostFn = parentCollection[keyOrIndex];
      let childValuePostFnIsArray = Array.isArray(childValuePostFn);
      let childValuePostFnIsObject = isValidObject(childValuePostFn);

      if (childValuePostFnIsArray || childValuePostFnIsObject) {
        if (fnReturnCode !== LOOP.SKIP_CHILDREN) {
          let childLoopReturnCode = forEachLoop(
            childValuePostFn,
            fn,
            deepPath,
            settings,
            childValuePostFnIsArray,
            childValuePostFnIsObject
          );

          if (childLoopReturnCode === LOOP.BREAK_ALL) {
            loopReturnCode = childLoopReturnCode;
            return false;
          }
        }
      }
    });
  }
  return loopReturnCode;
}

function validateOptions(options: Options): void {
  for (let key in options) {
    if (options.hasOwnProperty(key)) {
      const typeOfOption = typeof options[key];
      if (typeOfOption !== 'boolean') {
        throw new TypeError(
          `Ivalid option, ${key} sould be a boolean, instead got a ${typeOfOption}`
        );
      }
    }
  }
  return;
}
