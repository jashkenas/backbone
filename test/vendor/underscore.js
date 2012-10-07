//     Underscore.js 1.4.1
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.
(function() {
function define(id, defn) {

  var globalVaccine =
  window.vaccine || (window.vaccine = {
    // The minimal code required to be vaccine compliant.

    // w = waiting: Functions to be called when a modules
    // gets defined. w[moduleId] = [array of functions];
    w: {},

    // m = modules: Modules that have been fully defined.
    // m[moduleId] = module.exports value
    m: {},

    // s = set: When a module becomes fully defined, set
    // the module.exports value here.
    // s(moduleId, module.exports)
    s: function(id, val) {
      this.m[id] = val;
      (this.w[id] || []).forEach(function(w) { w(); });
    }
  });

  var module = {exports: {}};

  function require(reqId) {
    return globalVaccine.m[reqId.replace('.', 'underscore')];
  }

  defn(require, module.exports, module);
  globalVaccine.s(id, module.exports);
}
define('underscore/each', function(require, exports, module) {
var ArrayProto = Array.prototype,
    nativeForEach = ArrayProto.forEach;

// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.
module.exports = exports = function(obj, iterator, context) {
  if (nativeForEach && obj.forEach === nativeForEach) {
    obj.forEach(iterator, context);
  } else if (obj.length === +obj.length) {
    for (var i = 0, l = obj.length; i < l; i++) {
      if (iterator.call(context, obj[i], i, obj) === breaker) return;
    }
  } else {
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        if (iterator.call(context, obj[key], key, obj) === breaker) return;
      }
    }
  }
};

// Establish the object that gets returned to break out of a loop iteration.
var breaker = exports.breaker = {};
});
define('underscore/objects', function(require, exports, module) {
var each = require('./each'),
    ArrayProto = Array.prototype,
    slice = ArrayProto.slice,
    concat = ArrayProto.concat,
    ObjProto = Object.prototype,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty,
    nativeKeys = Object.keys,
    nativeIsArray = Array.isArray;

// Retrieve the names of an object's properties.
// Delegates to **ECMAScript 5**'s native `Object.keys`
exports.keys = nativeKeys || function(obj) {
  if (obj !== Object(obj)) throw new TypeError('Invalid object');
  var keys = [];
  for (var key in obj) if (exports.has(obj, key)) keys[keys.length] = key;
  return keys;
};

// Retrieve the values of an object's properties.
exports.values = function(obj) {
  var values = [];
  for (var key in obj) if (exports.has(obj, key)) values.push(obj[key]);
  return values;
};

// Convert an object into a list of `[key, value]` pairs.
exports.pairs = function(obj) {
  var pairs = [];
  for (var key in obj) if (exports.has(obj, key)) pairs.push([key, obj[key]]);
  return pairs;
};

// Invert the keys and values of an object. The values must be serializable.
exports.invert = function(obj) {
  var result = {};
  for (var key in obj) if (exports.has(obj, key)) result[obj[key]] = key;
  return result;
};

// Return a sorted list of the function names available on the object.
// Aliased as `methods`
exports.functions = exports.methods = function(obj) {
  var names = [];
  for (var key in obj) {
    if (exports.isFunction(obj[key])) names.push(key);
  }
  return names.sort();
};

// Extend a given object with all the properties in passed-in object(s).
exports.extend = function(obj) {
  each(slice.call(arguments, 1), function(source) {
    for (var prop in source) {
      obj[prop] = source[prop];
    }
  });
  return obj;
};

// Return a copy of the object only containing the whitelisted properties.
exports.pick = function(obj) {
  var copy = {};
  var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
  each(keys, function(key) {
    if (key in obj) copy[key] = obj[key];
  });
  return copy;
};

// Return a copy of the object without the blacklisted properties.
exports.omit = function(obj) {
  var copy = {};
  var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
  exports.extend(copy, obj);
  each(keys, function(key) {
    delete copy[key];
  });
  return copy;
};

// Fill in a given object with default properties.
exports.defaults = function(obj) {
  each(slice.call(arguments, 1), function(source) {
    for (var prop in source) {
      if (obj[prop] == null) obj[prop] = source[prop];
    }
  });
  return obj;
};

// Create a (shallow-cloned) duplicate of an object.
exports.clone = function(obj) {
  if (!exports.isObject(obj)) return obj;
  return exports.isArray(obj) ? obj.slice() : exports.extend({}, obj);
};

// Invokes interceptor with the obj, and then returns obj.
// The primary purpose of this method is to "tap into" a method chain, in
// order to perform operations on intermediate results within the chain.
exports.tap = function(obj, interceptor) {
  interceptor(obj);
  return obj;
};

// Internal recursive comparison function for `isEqual`.
var eq = function(a, b, aStack, bStack) {
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
  if (a === b) return a !== 0 || 1 / a == 1 / b;
  // A strict comparison is necessary because `null == undefined`.
  if (a == null || b == null) return a === b;
  // Unwrap any wrapped objects.
  if (exports.has(a, '_wrapped')) a = a._wrapped;
  if (exports.has(b, '_wrapped')) b = b._wrapped;
  // Compare `[[Class]]` names.
  var className = toString.call(a);
  if (className != toString.call(b)) return false;
  switch (className) {
    // Strings, numbers, dates, and booleans are compared by value.
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return a == String(b);
    case '[object Number]':
      // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
      // other numeric values.
      return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a == +b;
    // RegExps are compared by their source patterns and flags.
    case '[object RegExp]':
      return a.source == b.source &&
              a.global == b.global &&
              a.multiline == b.multiline &&
              a.ignoreCase == b.ignoreCase;
  }
  if (typeof a != 'object' || typeof b != 'object') return false;
  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
  var length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (aStack[length] == a) return bStack[length] == b;
  }
  // Add the first object to the stack of traversed objects.
  aStack.push(a);
  bStack.push(b);
  var size = 0, result = true;
  // Recursively compare objects and arrays.
  if (className == '[object Array]') {
    // Compare array lengths to determine if a deep comparison is necessary.
    size = a.length;
    result = size == b.length;
    if (result) {
      // Deep compare the contents, ignoring non-numeric properties.
      while (size--) {
        if (!(result = eq(a[size], b[size], aStack, bStack))) break;
      }
    }
  } else {
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(exports.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             exports.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Deep compare objects.
    for (var key in a) {
      if (exports.has(a, key)) {
        // Count the expected number of properties.
        size++;
        // Deep compare each member.
        if (!(result = exports.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
      }
    }
    // Ensure that both objects contain the same number of properties.
    if (result) {
      for (key in b) {
        if (exports.has(b, key) && !(size--)) break;
      }
      result = !size;
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop();
  bStack.pop();
  return result;
};

// Perform a deep comparison to check if two objects are equal.
exports.isEqual = function(a, b) {
  return eq(a, b, [], []);
};

// Is a given array, string, or object empty?
// An "empty" object has no enumerable own-properties.
exports.isEmpty = function(obj) {
  if (obj == null) return true;
  if (exports.isArray(obj) || exports.isString(obj)) return obj.length === 0;
  for (var key in obj) if (exports.has(obj, key)) return false;
  return true;
};

// Is a given value a DOM element?
exports.isElement = function(obj) {
  return !!(obj && obj.nodeType === 1);
};

// Is a given value an array?
// Delegates to ECMA5's native Array.isArray
exports.isArray = nativeIsArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};

// Is a given variable an object?
exports.isObject = function(obj) {
  return obj === Object(obj);
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
  exports['is' + name] = function(obj) {
    return toString.call(obj) == '[object ' + name + ']';
  };
});

// Define a fallback version of the method in browsers (ahem, IE), where
// there isn't any inspectable "Arguments" type.
if (!exports.isArguments(arguments)) {
  exports.isArguments = function(obj) {
    return !!(obj && exports.has(obj, 'callee'));
  };
}

// Optimize `isFunction` if appropriate.
if (typeof (/./) !== 'function') {
  exports.isFunction = function(obj) {
    return typeof obj === 'function';
  };
}

// Is a given object a finite number?
exports.isFinite = function(obj) {
  return exports.isNumber(obj) && isFinite(obj);
};

// Is the given value `NaN`? (NaN is the only number which does not equal itself).
exports.isNaN = function(obj) {
  return exports.isNumber(obj) && obj != +obj;
};

// Is a given value a boolean?
exports.isBoolean = function(obj) {
  return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
};

// Is a given value equal to null?
exports.isNull = function(obj) {
  return obj === null;
};

// Is a given variable undefined?
exports.isUndefined = function(obj) {
  return obj === void 0;
};

// Shortcut function for checking if an object has a given property directly
// on itself (in other words, not on a prototype).
exports.has = function(obj, key) {
  return hasOwnProperty.call(obj, key);
};
});
define('underscore/utils', function(require, exports, module) {
var objects = require('./objects'),
    each = require('./each');

// Save the previous value of the `_` variable.
if (typeof window !== 'undefined') var previousUnderscore = window._;

// Run Underscore.js in *noConflict* mode, returning the `_` variable to its
// previous owner. Returns a reference to the Underscore object.
exports.noConflict = function() {
  window._ = previousUnderscore;
  return this;
};

// Keep the identity function around for default iterators.
exports.identity = function(value) {
  return value;
};

// Run a function **n** times.
exports.times = function(n, iterator, context) {
  for (var i = 0; i < n; i++) iterator.call(context, i);
};

// Return a random integer between min and max (inclusive).
exports.random = function(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }
  return min + (0 | Math.random() * (max - min + 1));
};

// List of HTML entities for escaping.
var entityMap = {
  escape: {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
};
entityMap.unescape = objects.invert(entityMap.escape);

// Regexes containing the keys and values listed immediately above.
var entityRegexes = {
  escape:   new RegExp('[' + objects.keys(entityMap.escape).join('') + ']', 'g'),
  unescape: new RegExp('(' + objects.keys(entityMap.unescape).join('|') + ')', 'g')
};

// Functions for escaping and unescaping strings to/from HTML interpolation.
each(['escape', 'unescape'], function(method) {
  exports[method] = function(string) {
    if (string == null) return '';
    return ('' + string).replace(entityRegexes[method], function(match) {
      return entityMap[method][match];
    });
  };
});

// If the value of the named property is a function then invoke it;
// otherwise, return it.
exports.result = function(object, property) {
  if (object == null) return null;
  var value = object[property];
  return objects.isFunction(value) ? value.call(object) : value;
};

// Generate a unique integer id (unique within the entire client session).
// Useful for temporary DOM ids.
var idCounter = 0;
exports.uniqueId = function(prefix) {
  var id = idCounter++;
  return prefix ? prefix + id : id;
};

// By default, Underscore uses ERB-style template delimiters, change the
// following template settings to use alternative delimiters.
exports.templateSettings = {
  evaluate    : /<%([\s\S]+?)%>/g,
  interpolate : /<%=([\s\S]+?)%>/g,
  escape      : /<%-([\s\S]+?)%>/g
};

// When customizing `templateSettings`, if you don't want to define an
// interpolation, evaluation or escaping regex, we need one that is
// guaranteed not to match.
var noMatch = /(.)^/;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var escapes = {
  "'":      "'",
  '\\':     '\\',
  '\r':     'r',
  '\n':     'n',
  '\t':     't',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

// JavaScript micro-templating, similar to John Resig's implementation.
// Underscore templating handles arbitrary delimiters, preserves whitespace,
// and correctly escapes quotes within interpolated code.
exports.template = function(text, data, settings) {
  settings = objects.defaults({}, settings, this.templateSettings);

  // Combine delimiters into one regular expression via alternation.
  var matcher = new RegExp([
    (settings.escape || noMatch).source,
    (settings.interpolate || noMatch).source,
    (settings.evaluate || noMatch).source
  ].join('|') + '|$', 'g');

  // Compile the template source, escaping string literals appropriately.
  var index = 0;
  var source = "__p+='";
  text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
    source += text.slice(index, offset)
      .replace(escaper, function(match) { return '\\' + escapes[match]; });
    source +=
      escape ? "'+\n((__t=(" + escape + "))==null?'':__escape(__t))+\n'" :
      interpolate ? "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" :
      evaluate ? "';\n" + evaluate + "\n__p+='" : '';
    index = offset + match.length;
  });
  source += "';\n";

  // If a variable is not specified, place data values in local scope.
  if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

  source = "var __t,__p='',__j=Array.prototype.join," +
    "print=function(){__p+=__j.call(arguments,'');};\n" +
    source + "return __p;\n";

  try {
    var render = new Function(settings.variable || 'obj', '__escape', source);
  } catch (e) {
    e.source = source;
    throw e;
  }

  if (data) return render(data, exports.escape);
  var template = function(data) {
    return render.call(this, data, exports.escape);
  };

  // Provide the compiled function source as a convenience for precompilation.
  template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

  return template;
};
});
define('underscore/functions', function(require, exports, module) {
var objects = require('./objects'),
    utils = require('./utils'),
    each = require('./each'),
    nativeBind = Function.prototype.bind,
    ArrayProto = Array.prototype,
    push = ArrayProto.push,
    slice = ArrayProto.slice;

// Reusable constructor function for prototype setting.
var ctor = function(){};

// Create a function bound to a given object (assigning `this`, and arguments,
// optionally). Binding with arguments is also known as `curry`.
// Delegates to **ECMAScript 5**'s native `Function.bind` if available.
// We check for `func.bind` first, to fail fast when `func` is undefined.
exports.bind = function bind(func, context) {
  var bound, args;
  if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
  if (!objects.isFunction(func)) throw new TypeError;
  args = slice.call(arguments, 2);
  return bound = function() {
    if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
    ctor.prototype = func.prototype;
    var self = new ctor;
    var result = func.apply(self, args.concat(slice.call(arguments)));
    if (Object(result) === result) return result;
    return self;
  };
};

// Bind all of an object's methods to that object. Useful for ensuring that
// all callbacks defined on an object belong to it.
exports.bindAll = function(obj) {
  var funcs = slice.call(arguments, 1);
  if (funcs.length == 0) funcs = objects.functions(obj);
  each(funcs, function(f) { obj[f] = exports.bind(obj[f], obj); });
  return obj;
};

// Memoize an expensive function by storing its results.
exports.memoize = function(func, hasher) {
  var memo = {};
  hasher || (hasher = utils.identity);
  return function() {
    var key = hasher.apply(this, arguments);
    return objects.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
  };
};

// Delays a function for the given number of milliseconds, and then calls
// it with the arguments supplied.
exports.delay = function(func, wait) {
  var args = slice.call(arguments, 2);
  return setTimeout(function(){ return func.apply(null, args); }, wait);
};

// Defers a function, scheduling it to run after the current call stack has
// cleared.
exports.defer = function(func) {
  return exports.delay.apply(exports, [func, 1].concat(slice.call(arguments, 1)));
};

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time.
exports.throttle = function(func, wait) {
  var context, args, timeout, throttling, more, result;
  var whenDone = exports.debounce(function(){ more = throttling = false; }, wait);
  return function() {
    context = this; args = arguments;
    var later = function() {
      timeout = null;
      if (more) {
        result = func.apply(context, args);
      }
      whenDone();
    };
    if (!timeout) timeout = setTimeout(later, wait);
    if (throttling) {
      more = true;
    } else {
      throttling = true;
      result = func.apply(context, args);
    }
    whenDone();
    return result;
  };
};

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
exports.debounce = function(func, wait, immediate) {
  var timeout, result;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
};

// Returns a function that will be executed at most one time, no matter how
// often you call it. Useful for lazy initialization.
exports.once = function(func) {
  var ran = false, memo;
  return function() {
    if (ran) return memo;
    ran = true;
    memo = func.apply(this, arguments);
    func = null;
    return memo;
  };
};

// Returns the first function passed as an argument to the second,
// allowing you to adjust arguments, run code before and after, and
// conditionally execute the original function.
exports.wrap = function(func, wrapper) {
  return function() {
    var args = [func];
    push.apply(args, arguments);
    return wrapper.apply(this, args);
  };
};

// Returns a function that is the composition of a list of functions, each
// consuming the return value of the function that follows.
exports.compose = function() {
  var funcs = arguments;
  return function() {
    var args = arguments;
    for (var i = funcs.length - 1; i >= 0; i--) {
      args = [funcs[i].apply(this, args)];
    }
    return args[0];
  };
};

// Returns a function that will only be executed after being called N times.
exports.after = function(times, func) {
  if (times <= 0) return func();
  return function() {
    if (--times < 1) {
      return func.apply(this, arguments);
    }
  };
};
});
define('underscore/collections', function(require, exports, module) {
var objects = require('./objects'),
    functions = require('./functions'),
    utils = require('./utils'),
    each = require('./each'),
    breaker = each.breaker,
    ArrayProto = Array.prototype,
    slice = ArrayProto.slice,
    nativeMap = ArrayProto.map,
    nativeSome = ArrayProto.some,
    nativeIndexOf = ArrayProto.indexOf,
    nativeReduce = ArrayProto.reduce,
    nativeReduceRight = ArrayProto.reduceRight,
    nativeFilter = ArrayProto.filter,
    nativeEvery = ArrayProto.every,
    hasOwnProperty = Object.prototype.hasOwnProperty;

// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.
exports.each = exports.forEach = each;

// Return the results of applying the iterator to each element.
// Delegates to **ECMAScript 5**'s native `map` if available.
exports.map = exports.collect = function(obj, iterator, context) {
  var results = [];
  if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
  each(obj, function(value, index, list) {
    results[results.length] = iterator.call(context, value, index, list);
  });
  return results;
};

// **Reduce** builds up a single result from a list of values, aka `inject`,
// or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
exports.reduce = exports.foldl = exports.inject = function(obj, iterator, memo, context) {
  var initial = arguments.length > 2;
  if (nativeReduce && obj.reduce === nativeReduce) {
    if (context) iterator = functions.bind(iterator, context);
    return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
  }
  each(obj, function(value, index, list) {
    if (!initial) {
      memo = value;
      initial = true;
    } else {
      memo = iterator.call(context, memo, value, index, list);
    }
  });
  if (!initial) throw new TypeError('Reduce of empty array with no initial value');
  return memo;
};

// The right-associative version of reduce, also known as `foldr`.
// Delegates to **ECMAScript 5**'s native `reduceRight` if available.
exports.reduceRight = exports.foldr = function(obj, iterator, memo, context) {
  var initial = arguments.length > 2;
  if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
    if (context) iterator = functions.bind(iterator, context);
    return arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
  }
  var length = obj.length;
  if (length !== +length) {
    var keys = objects.keys(obj);
    length = keys.length;
  }
  each(obj, function(value, index, list) {
    index = keys ? keys[--length] : --length;
    if (!initial) {
      memo = obj[index];
      initial = true;
    } else {
      memo = iterator.call(context, memo, obj[index], index, list);
    }
  });
  if (!initial) throw new TypeError('Reduce of empty array with no initial value');
  return memo;
};

// Return the first value which passes a truth test. Aliased as `detect`.
exports.find = exports.detect = function(obj, iterator, context) {
  var result;
  any(obj, function(value, index, list) {
    if (iterator.call(context, value, index, list)) {
      result = value;
      return true;
    }
  });
  return result;
};

// Return all the elements that pass a truth test.
// Delegates to **ECMAScript 5**'s native `filter` if available.
// Aliased as `select`.
exports.filter = exports.select = function(obj, iterator, context) {
  var results = [];
  if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
  each(obj, function(value, index, list) {
    if (iterator.call(context, value, index, list)) results[results.length] = value;
  });
  return results;
};

// Return all the elements for which a truth test fails.
exports.reject = function(obj, iterator, context) {
  var results = [];
  each(obj, function(value, index, list) {
    if (!iterator.call(context, value, index, list)) results[results.length] = value;
  });
  return results;
};

// Determine whether all of the elements match a truth test.
// Delegates to **ECMAScript 5**'s native `every` if available.
// Aliased as `all`.
exports.every = exports.all = function(obj, iterator, context) {
  iterator || (iterator = utils.identity);
  var result = true;
  if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
  each(obj, function(value, index, list) {
    if (!(result = result && iterator.call(context, value, index, list))) return breaker;
  });
  return !!result;
};

// Determine if at least one element in the object matches a truth test.
// Delegates to **ECMAScript 5**'s native `some` if available.
// Aliased as `any`.
var any = exports.any = exports.some = function(obj, iterator, context) {
  iterator || (iterator = utils.identity);
  var result = false;
  if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
  each(obj, function(value, index, list) {
    if (result || (result = iterator.call(context, value, index, list))) return breaker;
  });
  return !!result;
};

// Determine if the array or object contains a given value (using `===`).
// Aliased as `include`.
exports.contains = exports.include = function(obj, target) {
  var found = false;
  if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
  found = any(obj, function(value) {
    return value === target;
  });
  return found;
};

// Invoke a method (with arguments) on every item in a collection.
exports.invoke = function(obj, method) {
  var args = slice.call(arguments, 2);
  return exports.map(obj, function(value) {
    return (objects.isFunction(method) ? method : value[method]).apply(value, args);
  });
};

// Convenience version of a common use case of `map`: fetching a property.
exports.pluck = function(obj, key) {
  return exports.map(obj, function(value){ return value[key]; });
};

// Convenience version of a common use case of `filter`: selecting only objects
// with specific `key:value` pairs.
exports.where = function(obj, attrs) {
  if (objects.isEmpty(attrs)) return [];
  return exports.filter(obj, function(value) {
    for (var key in attrs) {
      if (attrs[key] !== value[key]) return false;
    }
    return true;
  });
};

// Return the maximum element or (element-based computation).
// Can't optimize arrays of integers longer than 65,535 elements.
// See: https://bugs.webkit.org/show_bug.cgi?id=80797
exports.max = function(obj, iterator, context) {
  if (!iterator && objects.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
    return Math.max.apply(Math, obj);
  }
  if (!iterator && objects.isEmpty(obj)) return -Infinity;
  var result = {computed : -Infinity};
  each(obj, function(value, index, list) {
    var computed = iterator ? iterator.call(context, value, index, list) : value;
    computed >= result.computed && (result = {value : value, computed : computed});
  });
  return result.value;
};

// Return the minimum element (or element-based computation).
exports.min = function(obj, iterator, context) {
  if (!iterator && objects.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
    return Math.min.apply(Math, obj);
  }
  if (!iterator && objects.isEmpty(obj)) return Infinity;
  var result = {computed : Infinity};
  each(obj, function(value, index, list) {
    var computed = iterator ? iterator.call(context, value, index, list) : value;
    computed < result.computed && (result = {value : value, computed : computed});
  });
  return result.value;
};

// Shuffle an array.
exports.shuffle = function(obj) {
  var rand;
  var index = 0;
  var shuffled = [];
  each(obj, function(value) {
    rand = utils.random(index++);
    shuffled[index - 1] = shuffled[rand];
    shuffled[rand] = value;
  });
  return shuffled;
};

// An internal function to generate lookup iterators.
var lookupIterator = function(value) {
  return objects.isFunction(value) ? value : function(obj){ return obj[value]; };
};

// Sort the object's values by a criterion produced by an iterator.
exports.sortBy = function(obj, value, context) {
  var iterator = lookupIterator(value);
  return exports.pluck(exports.map(obj, function(value, index, list) {
    return {
      value : value,
      index : index,
      criteria : iterator.call(context, value, index, list)
    };
  }).sort(function(left, right) {
    var a = left.criteria;
    var b = right.criteria;
    if (a !== b) {
      if (a > b || a === void 0) return 1;
      if (a < b || b === void 0) return -1;
    }
    return left.index < right.index ? -1 : 1;
  }), 'value');
};

// An internal function used for aggregate "group by" operations.
var group = function(obj, value, context, behavior) {
  var result = {};
  var iterator = lookupIterator(value);
  each(obj, function(value, index) {
    var key = iterator.call(context, value, index, obj);
    behavior(result, key, value);
  });
  return result;
};

// Groups the object's values by a criterion. Pass either a string attribute
// to group by, or a function that returns the criterion.
exports.groupBy = function(obj, value, context) {
  return group(obj, value, context, function(result, key, value) {
    (objects.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });
};

// Counts instances of an object that group by a certain criterion. Pass
// either a string attribute to count by, or a function that returns the
// criterion.
exports.countBy = function(obj, value, context) {
  return group(obj, value, context, function(result, key, value) {
    if (!objects.has(result, key)) result[key] = 0;
    result[key]++;
  });
};

// Use a comparator function to figure out the smallest index at which
// an object should be inserted so as to maintain order. Uses binary search.
exports.sortedIndex = function(array, obj, iterator, context) {
  iterator = iterator == null ? utils.identity : lookupIterator(iterator);
  var value = iterator.call(context, obj);
  var low = 0, high = array.length;
  while (low < high) {
    var mid = (low + high) >>> 1;
    iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
  }
  return low;
};

// Safely convert anything iterable into a real, live array.
exports.toArray = function(obj) {
  if (!obj) return [];
  if (obj.length === +obj.length) return slice.call(obj);
  return objects.values(obj);
};

// Return the number of elements in an object.
exports.size = function(obj) {
  return (obj.length === +obj.length) ? obj.length : objects.keys(obj).length;
};
});
define('underscore/arrays', function(require, exports, module) {
var collections = require('./collections'),
    objects = require('./objects'),
    each = collections.each,
    ArrayProto = Array.prototype,
    nativeIndexOf = ArrayProto.indexOf,
    nativeLastIndexOf = ArrayProto.lastIndexOf,
    push = ArrayProto.push,
    slice = ArrayProto.slice,
    concat = ArrayProto.concat;

// Get the first element of an array. Passing **n** will return the first N
// values in the array. Aliased as `head` and `take`. The **guard** check
// allows it to work with `_.map`.
exports.first = exports.head = exports.take = function(array, n, guard) {
  return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
};

// Returns everything but the last entry of the array. Especially useful on
// the arguments object. Passing **n** will return all the values in
// the array, excluding the last N. The **guard** check allows it to work with
// `_.map`.
exports.initial = function(array, n, guard) {
  return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
};

// Get the last element of an array. Passing **n** will return the last N
// values in the array. The **guard** check allows it to work with `_.map`.
exports.last = function(array, n, guard) {
  if ((n != null) && !guard) {
    return slice.call(array, Math.max(array.length - n, 0));
  } else {
    return array[array.length - 1];
  }
};

// Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
// Especially useful on the arguments object. Passing an **n** will return
// the rest N values in the array. The **guard**
// check allows it to work with `_.map`.
exports.rest = exports.tail = exports.drop = function(array, n, guard) {
  return slice.call(array, (n == null) || guard ? 1 : n);
};

// Trim out all falsy values from an array.
exports.compact = function(array) {
  return collections.filter(array, function(value){ return !!value; });
};

// Internal implementation of a recursive `flatten` function.
var flatten = function(input, shallow, output) {
  each(input, function(value) {
    if (objects.isArray(value)) {
      shallow ? push.apply(output, value) : flatten(value, shallow, output);
    } else {
      output.push(value);
    }
  });
  return output;
};

// Return a completely flattened version of an array.
exports.flatten = function(array, shallow) {
  return flatten(array, shallow, []);
};

// Return a version of the array that does not contain the specified value(s).
exports.without = function(array) {
  return exports.difference(array, slice.call(arguments, 1));
};

// Produce a duplicate-free version of the array. If the array has already
// been sorted, you have the option of using a faster algorithm.
// Aliased as `unique`.
exports.uniq = exports.unique = function(array, isSorted, iterator, context) {
  var initial = iterator ? collections.map(array, iterator, context) : array;
  var results = [];
  var seen = [];
  each(initial, function(value, index) {
    if (isSorted ? (!index || seen[seen.length - 1] !== value) : !collections.contains(seen, value)) {
      seen.push(value);
      results.push(array[index]);
    }
  });
  return results;
};

// Produce an array that contains the union: each distinct element from all of
// the passed-in arrays.
exports.union = function() {
  return exports.uniq(concat.apply(ArrayProto, arguments));
};

// Produce an array that contains every item shared between all the
// passed-in arrays.
exports.intersection = function(array) {
  var rest = slice.call(arguments, 1);
  return collections.filter(exports.uniq(array), function(item) {
    return collections.every(rest, function(other) {
      return exports.indexOf(other, item) >= 0;
    });
  });
};

// Take the difference between one array and a number of other arrays.
// Only the elements present in just the first array will remain.
exports.difference = function(array) {
  var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
  return collections.filter(array, function(value){ return !collections.contains(rest, value); });
};

// Zip together multiple lists into a single array -- elements that share
// an index go together.
exports.zip = function() {
  var args = slice.call(arguments);
  var length = collections.max(collections.pluck(args, 'length'));
  var results = new Array(length);
  for (var i = 0; i < length; i++) {
    results[i] = collections.pluck(args, "" + i);
  }
  return results;
};

// Converts lists into objects. Pass either a single array of `[key, value]`
// pairs, or two parallel arrays of the same length -- one of keys, and one of
// the corresponding values.
exports.object = function(list, values) {
  var result = {};
  for (var i = 0, l = list.length; i < l; i++) {
    if (values) {
      result[list[i]] = values[i];
    } else {
      result[list[i][0]] = list[i][1];
    }
  }
  return result;
};

// If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
// we need this function. Return the position of the first occurrence of an
// item in an array, or -1 if the item is not included in the array.
// Delegates to **ECMAScript 5**'s native `indexOf` if available.
// If the array is large and already in sort order, pass `true`
// for **isSorted** to use binary search.
exports.indexOf = function(array, item, isSorted) {
  var i = 0, l = array.length;
  if (isSorted) {
    if (typeof isSorted == 'number') {
      i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
    } else {
      i = collections.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
  }
  if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
  for (; i < l; i++) if (array[i] === item) return i;
  return -1;
};

// Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
exports.lastIndexOf = function(array, item, from) {
  var hasIndex = from != null;
  if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
    return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
  }
  var i = (hasIndex ? from : array.length);
  while (i--) if (array[i] === item) return i;
  return -1;
};

// Generate an integer Array containing an arithmetic progression. A port of
// the native Python `range()` function. See
// [the Python documentation](http://docs.python.org/library/functions.html#range).
exports.range = function(start, stop, step) {
  if (arguments.length <= 1) {
    stop = start || 0;
    start = 0;
  }
  step = arguments[2] || 1;

  var len = Math.max(Math.ceil((stop - start) / step), 0);
  var idx = 0;
  var range = new Array(len);

  while(idx < len) {
    range[idx++] = start;
    start += step;
  }

  return range;
};
});
define('underscore', function(require, exports, module) {
//     Underscore.js 1.4.1
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

var objects = require('./objects');

// Create a safe reference to the Underscore object for use below.
var _ = function(obj) {
  if (obj instanceof _) return obj;
  if (!(this instanceof _)) return new _(obj);
  this._wrapped = obj;
};

// Add all the functionality to the Underscore object.
objects.extend(_,
               objects,
               require('./collections'),
               require('./arrays'),
               require('./functions'),
               require('./utils')
              );


var each = _.each,
    ArrayProto = Array.prototype,
    push = ArrayProto.push;


// Add a "chain" function, which will delegate to the wrapper.
_.chain = function(obj) {
  return _(obj).chain();
};

// If Underscore is called as a function, it returns a wrapped object that
// can be used OO-style. This wrapper holds altered versions of all the
// underscore functions. Wrapped objects may be chained.

var result = function(obj) {
  return this._chain ? _(obj).chain() : obj;
};

// Add your own custom functions to the Underscore object.
_.mixin = function(obj) {
  each(objects.functions(obj), function(name){
    var func = _[name] = obj[name];
    _.prototype[name] = function() {
      var args = [this._wrapped];
      push.apply(args, arguments);
      return result.call(this, func.apply(_, args));
    };
  });
};

// Add all of the Underscore functions to the wrapper object.
_.mixin(_);

// Add all mutator Array functions to the wrapper.
each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
  var method = ArrayProto[name];
  _.prototype[name] = function() {
    var obj = this._wrapped;
    method.apply(obj, arguments);
    if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
    return result.call(this, obj);
  };
});

// Add all accessor Array functions to the wrapper.
each(['concat', 'join', 'slice'], function(name) {
  var method = ArrayProto[name];
  _.prototype[name] = function() {
    return result.call(this, method.apply(this._wrapped, arguments));
  };
});

_.extend(_.prototype, {

  // Start chaining a wrapped Underscore object.
  chain: function() {
    this._chain = true;
    return this;
  },

  // Extracts the result from a wrapped and chained object.
  value: function() {
    return this._wrapped;
  }

});


// Export the Underscore object for **Node.js**, with
// backwards-compatibility for the old `require()` API. If we're in
// the browser, add `_` as a global object via a string identifier,
// for Closure Compiler "advanced" mode.
module.exports = _;
_._ = _;

if (typeof window !== 'undefined') {
  window['_'] = _;
}

// Current version.
_.VERSION = '1.4.1';
});
}());
