/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Backbone.Model
// --------------

// Backbone **Models** are the basic data object in the framework --
// frequently representing a row in a table in a database on your server.
// A discrete chunk of data and a bunch of useful, related methods for
// performing computations and transformations on that data.

// Create a new model with the specified attributes. A client id (`cid`)
// is automatically generated and assigned for you.
Backbone.registerModule('Backbone.Model', ['Backbone', '_', 'Backbone.Events', 'slice',
    'Backbone.wrapError', 'Backbone.urlError', 'Backbone.extend'],
    function (Backbone, _, Events, slice, wrapError, urlError, extend) {
        "use strict";

        var Model = function (attributes, options) {
                var attrs = attributes || {},
                    opt = options || {};

                this.cid = _.uniqueId('c');
                this.attributes = {};

                if (opt.collection) {
                    this.collection = opt.collection;
                }

                if (opt.parse) {
                    attrs = this.parse(attrs, opt) || {};
                }

                attrs = _.defaults({}, attrs, _.result(this, 'defaults'));

                this.set(attrs, opt);

                this.changed = {};

                this.initialize.apply(this, arguments);
            },
        // Underscore methods that we want to implement on the Model.
            modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

        // Attach all inheritable methods to the Model prototype.
        _.extend(Model.prototype, Events, {

            // A hash of attributes whose current and previous value differ.
            changed: null,

            // The value returned during the last failed validation.
            validationError: null,

            // The default name for the JSON `id` attribute is `"id"`. MongoDB and
            // CouchDB users may want to set this to `"_id"`.
            idAttribute: 'id',

            // The function that will generate an id for a model given that model's
            // attributes.
            generateId: function (attrs) {
                return attrs[this.idAttribute];
            },

            // Initialize is an empty function by default. Override it with your own
            // initialization logic.
            initialize: function () {
            },

            // Return a copy of the model's `attributes` object.
            toJSON: function (options) {
                return _.clone(this.attributes);
            },

            // Proxy `Backbone.sync` by default -- but override this if you need
            // custom syncing semantics for *this* particular model.
            sync: function () {
                return Backbone.sync.apply(this, arguments);
            },

            // Get the value of an attribute.
            get: function (attr) {
                return this.attributes[attr];
            },

            // Get the HTML-escaped value of an attribute.
            escape: function (attr) {
                return _.escape(this.get(attr));
            },

            // Returns `true` if the attribute contains a value that is not null
            // or undefined.
            has: function (attr) {
                var attribute = this.get(attr);
                return (attribute !== null && attribute !== undefined);
            },

            // Set a hash of model attributes on the object, firing `"change"`. This is
            // the core primitive operation of a model, updating the data and notifying
            // anyone who needs to know about the change in state. The heart of the beast.
            set: function (key, val, options) {
                var attr, attrs, unset, changes, silent, changing, prev, current, prevId, i, length;
                if (key === null || key === undefined) {
                    return this;
                }

                // Handle both `"key", value` and `{key: value}` -style arguments.
                if (typeof key === 'object') {
                    attrs = key;
                    options = val;
                } else {
                    (attrs = {})[key] = val;
                }

                options = options || {};

                // Run validation.
                if (!this._validate(attrs, options)) {
                    return false;
                }

                // Extract attributes and options.
                unset = options.unset;
                silent = options.silent;
                changes = [];
                changing = this._changing;
                this._changing = true;

                if (!changing) {
                    this._previousAttributes = _.clone(this.attributes);
                    this.changed = {};
                }
                current = this.attributes;
                prev = this._previousAttributes;

                // For each `set` attribute, update or delete the current value.
                for (attr in attrs) {
                    if (attrs.hasOwnProperty(attr)) {
                        val = attrs[attr];
                        if (!_.isEqual(current[attr], val)) {
                            changes.push(attr);
                        }

                        if (!_.isEqual(prev[attr], val)) {
                            this.changed[attr] = val;
                        } else {
                            delete this.changed[attr];
                        }
                        if (unset) {
                            delete current[attr];
                        } else {
                            current[attr] = val;
                        }
                    }
                }

                prevId = this.id;
                this.id = this.generateId(current);
                if (prevId !== this.id) {
                    this.trigger('change-id', this, prevId, options);
                }

                // Trigger all relevant attribute changes.
                if (!silent) {
                    if (changes.length) {
                        this._pending = options;
                    }
                    for (i = 0, length = changes.length; i < length; i += 1) {
                        this.trigger('change:' + changes[i], this, current[changes[i]], options);
                    }
                }

                // You might be wondering why there's a `while` loop here. Changes can
                // be recursively nested within `"change"` events.
                if (changing) {
                    return this;
                }

                if (!silent) {
                    while (this._pending) {
                        options = this._pending;
                        this._pending = false;
                        this.trigger('change', this, options);
                    }
                }
                this._pending = false;
                this._changing = false;
                return this;
            },

            // Remove an attribute from the model, firing `"change"`. `unset` is a noop
            // if the attribute doesn't exist.
            unset: function (attr, options) {
                return this.set(attr, undefined, _.extend({}, options, {unset: true}));
            },

            // Clear all attributes on the model, firing `"change"`.
            clear: function (options) {
                var attrs = {}, key;
                for (key in this.attributes) {
                    if (this.attributes.hasOwnProperty(key)) {
                        attrs[key] = undefined;
                    }
                }
                return this.set(attrs, _.extend({}, options, {unset: true}));
            },

            // Determine if the model has changed since the last `"change"` event.
            // If you specify an attribute name, determine if that attribute has changed.
            hasChanged: function (attr) {
                if (attr === null || attr === undefined) {
                    return !_.isEmpty(this.changed);
                }
                return _.has(this.changed, attr);
            },

            // Return an object containing all the attributes that have changed, or
            // false if there are no changed attributes. Useful for determining what
            // parts of a view need to be updated and/or what attributes need to be
            // persisted to the server. Unset attributes will be set to undefined.
            // You can also pass an attributes object to diff against the model,
            // determining if there *would be* a change.
            changedAttributes: function (diff) {
                if (!diff) {
                    return this.hasChanged() ? _.clone(this.changed) : false;
                }
                var val, changed = false,
                    old = this._changing ? this._previousAttributes : this.attributes,
                    attr;
                for (attr in diff) {
                    if (diff.hasOwnProperty(attr)) {
                        if (_.isEqual(old[attr], (val = diff[attr])) === false) {
                            changed = changed || {};
                            changed[attr] = val;
                        }
                    }
                }
                return changed;
            },

            // Get the previous value of an attribute, recorded at the time the last
            // `"change"` event was fired.
            previous: function (attr) {
                if (attr === null || attr === undefined || !this._previousAttributes) {
                    return null;
                }
                return this._previousAttributes[attr];
            },

            // Get all of the attributes of the model at the time of the previous
            // `"change"` event.
            previousAttributes: function () {
                return _.clone(this._previousAttributes);
            },

            // Fetch the model from the server. If the server's representation of the
            // model differs from its current attributes, they will be overridden,
            // triggering a `"change"` event.
            fetch: function (options) {
                options = options ? _.clone(options) : {};
                if (options.parse === undefined) {
                    options.parse = true;
                }
                var model = this,
                    success = options.success;

                options.success = function (resp) {
                    if (!model.set(model.parse(resp, options), options)) {
                        return false;
                    }
                    if (success) {
                        success(model, resp, options);
                    }
                    model.trigger('sync', model, resp, options);
                };
                wrapError(this, options);
                return this.sync('read', this, options);
            },

            // Set a hash of model attributes, and sync the model to the server.
            // If the server returns an attributes hash that differs, the model's
            // state will be `set` again.
            save: function (key, val, options) {
                var attrs, method, xhr, attributes = this.attributes, model, success;

                // Handle both `"key", value` and `{key: value}` -style arguments.
                if (key === null || key === undefined || typeof key === 'object') {
                    attrs = key;
                    options = val;
                } else {
                    (attrs = {})[key] = val;
                }

                options = _.extend({validate: true}, options);

                // If we're not waiting and attributes exist, save acts as
                // `set(attr).save(null, opts)` with validation. Otherwise, check if
                // the model will be valid when the attributes, if any, are set.
                if (attrs && !options.wait) {
                    if (!this.set(attrs, options)) {
                        return false;
                    }
                } else {
                    if (!this._validate(attrs, options)) {
                        return false;
                    }
                }

                // Set temporary attributes if `{wait: true}`.
                if (attrs && options.wait) {
                    this.attributes = _.extend({}, attributes, attrs);
                }

                // After a successful server-side save, the client is (optionally)
                // updated with the server-side state.
                if (options.parse === undefined) {
                    options.parse = true;
                }
                model = this;
                success = options.success;

                options.success = function (resp) {
                    // Ensure attributes are restored during synchronous saves.
                    model.attributes = attributes;
                    var serverAttrs = model.parse(resp, options);
                    if (options.wait) {
                        serverAttrs = _.extend(attrs || {}, serverAttrs);
                    }
                    if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
                        return false;
                    }
                    if (success) {
                        success(model, resp, options);
                    }
                    model.trigger('sync', model, resp, options);
                };
                wrapError(this, options);

                method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
                if (method === 'patch') {
                    options.attrs = attrs;
                }
                xhr = this.sync(method, this, options);

                // Restore attributes.
                if (attrs && options.wait) {
                    this.attributes = attributes;
                }

                return xhr;
            },

            // Destroy this model on the server if it was already persisted.
            // Optimistically removes the model from its collection, if it has one.
            // If `wait: true` is passed, waits for the server to respond before removal.
            destroy: function (options) {
                options = options ? _.clone(options) : {};
                var model = this,
                    success = options.success,
                    destroy = function () {
                        model.trigger('destroy', model, model.collection, options);
                    },
                    xhr;

                options.success = function (resp) {
                    if (options.wait || model.isNew()) {
                        destroy();
                    }
                    if (success) {
                        success(model, resp, options);
                    }
                    if (!model.isNew()) {
                        model.trigger('sync', model, resp, options);
                    }
                };

                if (this.isNew()) {
                    options.success();
                    return false;
                }
                wrapError(this, options);

                xhr = this.sync('delete', this, options);
                if (!options.wait) {
                    destroy();
                }
                return xhr;
            },

            // Default URL for the model's representation on the server -- if you're
            // using Backbone's restful methods, override this to change the endpoint
            // that will be called.
            url: function () {
                var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
                if (this.isNew()) {
                    return base;
                }
                return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
            },

            // **parse** converts a response into the hash of attributes to be `set` on
            // the model. The default implementation is just to pass the response along.
            parse: function (resp, options) {
                return resp;
            },

            // Create a new model with identical attributes to this one.
            clone: function () {
                return new this.constructor(this.attributes);
            },

            // A model is new if it has never been saved to the server, and lacks an id.
            isNew: function () {
                return (this.id === null || this.id === undefined);
            },

            // Check if the model is currently in a valid state.
            isValid: function (options) {
                return this._validate({}, _.extend(options || {}, { validate: true }));
            },

            // Run validation against the next complete set of model attributes,
            // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
            _validate: function (attrs, options) {
                if (!options.validate || !this.validate) {
                    return true;
                }
                attrs = _.extend({}, this.attributes, attrs);
                var error = this.validationError = this.validate(attrs, options) || null;
                if (!error) {
                    return true;
                }
                this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
                return false;
            }

        });

        // Mix in each Underscore method as a proxy to `Model#attributes`.
        _.each(modelMethods, function (method) {
            if (!_[method]) {
                return;
            }
            Model.prototype[method] = function () {
                var args = slice.call(arguments);
                args.unshift(this.attributes);
                return _[method].apply(_, args);
            };
        });

        Model.extend = extend;

        return Model;
    });
