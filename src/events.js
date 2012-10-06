// Regular expression used to split event strings
var eventSplitter = /\s+/;

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback functions
// to an event; `trigger`-ing an event fires all callbacks in succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//
module.exports = exports = {

  // Bind one or more space separated events, `events`, to a `callback`
  // function. Passing `"all"` will bind the callback to all events fired.
  on: function(events, callback, context) {
    var calls, event, list;
    if (!callback) return this;

    events = events.split(eventSplitter);
    calls = this._callbacks || (this._callbacks = {});

    while (event = events.shift()) {
      list = calls[event] || (calls[event] = []);
      list.push(callback, context);
    }

    return this;
  },

  // Remove one or many callbacks. If `context` is null, removes all callbacks
  // with that function. If `callback` is null, removes all callbacks for the
  // event. If `events` is null, removes all bound callbacks for all events.
  off: function(events, callback, context) {
    var event, calls, list, i;

    // No events, or removing *all* events.
    if (!(calls = this._callbacks)) return this;
    if (!(events || callback || context)) {
      delete this._callbacks;
      return this;
    }

    events = events ? events.split(eventSplitter) : _.keys(calls);

    // Loop through the callback list, splicing where appropriate.
    while (event = events.shift()) {
      if (!(list = calls[event]) || !(callback || context)) {
        delete calls[event];
        continue;
      }

      for (i = list.length - 2; i >= 0; i -= 2) {
        if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
          list.splice(i, 2);
        }
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function(events) {
    var event, calls, list, i, length, args, all, rest;
    if (!(calls = this._callbacks)) return this;

    rest = [];
    events = events.split(eventSplitter);

    // Fill up `rest` with the callback arguments.  Since we're only copying
    // the tail of `arguments`, a loop is much faster than Array#slice.
    for (i = 1, length = arguments.length; i < length; i++) {
      rest[i - 1] = arguments[i];
    }

    // For each event, walk through the list of callbacks twice, first to
    // trigger the event, then to trigger any `"all"` callbacks.
    while (event = events.shift()) {
      // Copy callback lists to prevent modification.
      if (all = calls.all) all = all.slice();
      if (list = calls[event]) list = list.slice();

      // Execute event callbacks.
      if (list) {
        for (i = 0, length = list.length; i < length; i += 2) {
          list[i].apply(list[i + 1] || this, rest);
        }
      }

      // Execute "all" callbacks.
      if (all) {
        args = [event].concat(rest);
        for (i = 0, length = all.length; i < length; i += 2) {
          all[i].apply(all[i + 1] || this, args);
        }
      }
    }

    return this;
  }

};

// Aliases for backwards compatibility.
exports.bind   = exports.on;
exports.unbind = exports.off;
