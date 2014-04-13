/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Backbone.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

Backbone.registerModule('Backbone.Events', ['Backbone', '_', 'slice'],
    function (Backbone, _, slice) {
        "use strict";

        // Regular expression used to split event strings.
        var eventSplitter = /\s+/,

        // Implement fancy features of the Events API such as multiple event
        // names `"change blur"` and jQuery-style event maps `{change: action}`
        // in terms of the existing API.
            eventsApi = function (obj, action, name, rest) {
                var key, names, i, length;

                if (!name) {
                    return true;
                }

                // Handle event maps.
                if (typeof name === 'object') {
                    for (key in name) {
                        if (name.hasOwnProperty(key)) {
                            obj[action].apply(obj, [key, name[key]].concat(rest));
                        }
                    }
                    return false;
                }

                // Handle space separated event names.
                if (eventSplitter.test(name)) {
                    names = name.split(eventSplitter);
                    for (i = 0, length = names.length; i < length; i += 1) {
                        obj[action].apply(obj, [names[i]].concat(rest));
                    }
                    return false;
                }

                return true;
            },
        // A difficult-to-believe, but optimized internal dispatch function for
        // triggering events. Tries to keep the usual cases speedy (most internal
        // Backbone events have 3 arguments).
            triggerEvents = function (events, args) {
                var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
                switch (args.length) {
                case 0:
                    i += 1;
                    while (i < l) {
                        (ev = events[i]).callback.call(ev.ctx);
                        i += 1;
                    }
                    return;
                case 1:
                    i += 1;
                    while (i < l) {
                        (ev = events[i]).callback.call(ev.ctx, a1);
                        i += 1;
                    }
                    return;
                case 2:
                    i += 1;
                    while (i < l) {
                        (ev = events[i]).callback.call(ev.ctx, a1, a2);
                        i += 1;
                    }
                    return;
                case 3:
                    i += 1;
                    while (i < l) {
                        (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                        i += 1;
                    }
                    return;
                default:
                    i += 1;
                    while (i < l) {
                        (ev = events[i]).callback.apply(ev.ctx, args);
                        i += 1;
                    }
                    return;
                }
            },
            listenMethods = {listenTo: 'on', listenToOnce: 'once'},
        // public API
            Events = {

                // Bind an event to a `callback` function. Passing `"all"` will bind
                // the callback to all events fired.
                on: function (name, callback, context) {
                    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
                        return this;
                    }
                    this._events = this._events || {};

                    var events;

                    if (this._events[name]) {
                        events = this._events[name];
                    } else {
                        events = this._events[name] = [];
                    }

                    events.push({callback: callback, context: context, ctx: context || this});

                    return this;
                },

                // Bind an event to only be triggered a single time. After the first time
                // the callback is invoked, it will be removed.
                once: function (name, callback, context) {
                    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) {
                        return this;
                    }

                    var self = this,
                        once = _.once(function () {
                            self.off(name, once);
                            callback.apply(this, arguments);
                        });
                    once._callback = callback;

                    return this.on(name, once, context);
                },

                // Remove one or many callbacks. If `context` is null, removes all
                // callbacks with that function. If `callback` is null, removes all
                // callbacks for the event. If `name` is null, removes all bound
                // callbacks for all events.
                off: function (name, callback, context) {
                    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) {
                        return this;
                    }

                    // Remove all callbacks for all events.
                    if (!name && !callback && !context) {
                        this._events = undefined;
                        return this;
                    }

                    var names = name ? [name] : _.keys(this._events),
                        i,
                        length,
                        events,
                        j,
                        k,
                        event,
                        remaining;

                    for (i = 0, length = names.length; i < length; i += 1) {
                        name = names[i];

                        // Bail out if there are no events stored.
                        events = this._events[name];
                        if (events) {
                            // Remove all callbacks for this event.
                            if (!callback && !context) {
                                delete this._events[name];
                            } else {
                                // Find any remaining events.
                                remaining = [];
                                for (j = 0, k = events.length; j < k; j += 1) {
                                    event = events[j];
                                    if ((callback && (callback !== event.callback) &&
                                            (callback !== event.callback._callback)) ||
                                            (context && context !== event.context)
                                            ) {
                                        remaining.push(event);
                                    }
                                }

                                // Replace events if there are any remaining.  Otherwise, clean up.
                                if (remaining.length) {
                                    this._events[name] = remaining;
                                } else {
                                    delete this._events[name];
                                }
                            }
                        }
                    }

                    return this;
                },
                // Trigger one or many events, firing all bound callbacks. Callbacks are
                // passed the same arguments as `trigger` is, apart from the event name
                // (unless you're listening on `"all"`, which will cause your callback to
                // receive the true name of the event as the first argument).
                trigger: function (name) {
                    if (!this._events) {
                        return this;
                    }
                    var args = slice.call(arguments, 1),
                        events,
                        allEvents;

                    if (!eventsApi(this, 'trigger', name, args)) {
                        return this;
                    }

                    events = this._events[name];
                    allEvents = this._events.all;

                    if (events) {
                        triggerEvents(events, args);
                    }

                    if (allEvents) {
                        triggerEvents(allEvents, arguments);
                    }

                    return this;
                },

                // Tell this object to stop listening to either specific events ... or
                // to every object it's currently listening to.
                stopListening: function (obj, name, callback) {
                    var listeningTo = this._listeningTo,
                        remove,
                        id;
                    if (!listeningTo) {
                        return this;
                    }
                    remove = !name && !callback;
                    if (!callback && typeof name === 'object') {
                        callback = this;
                    }
                    if (obj) {
                        (listeningTo = {})[obj._listenId] = obj;
                    }
                    for (id in listeningTo) {
                        if (listeningTo.hasOwnProperty(id)) {
                            obj = listeningTo[id];
                            obj.off(name, callback, this);
                            if (remove || _.isEmpty(obj._events)) {
                                delete this._listeningTo[id];
                            }
                        }
                    }
                    return this;
                }
            };

// Inversion-of-control versions of `on` and `once`. Tell *this* object to
// listen to an event in another object ... keeping track of what it's
// listening to.
        _.each(listenMethods, function (implementation, method) {
            Events[method] = function (obj, name, callback) {
                var listeningTo,
                    id;

                if (this._listeningTo) {
                    listeningTo = this._listeningTo;
                } else {
                    listeningTo = this._listeningTo = {};
                }

                if (obj._listenId) {
                    id = obj._listenId;
                } else {
                    id = obj._listenId = _.uniqueId('l');
                }

                listeningTo[id] = obj;

                if (!callback && typeof name === 'object') {
                    callback = this;
                }

                obj[implementation](name, callback, this);

                return this;
            };
        });

        Events.bind = Events.on;
        Events.unbind = Events.off;

// Allow the `Backbone` object to serve as a global event bus, for folks who
// want global "pubsub" in a convenient place.
        _.extend(Backbone, Events);

        return Events;
    });