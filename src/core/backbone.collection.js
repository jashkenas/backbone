/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Backbone.Collection
// -------------------

// If models tend to represent a single row of data, a Backbone Collection is
// more analogous to a table full of data ... or a small slice or page of that
// table, or a collection of rows that belong together for a particular reason
// -- all of the messages in this particular folder, all of the documents
// belonging to this particular author, and so on. Collections maintain
// indexes of their models, both in order, and for lookup by `id`.

// Create a new **Collection**, perhaps to contain a specific type of `model`.
// If a `comparator` is specified, the Collection will maintain
// its models in sort order, as they're added and removed.
Backbone.registerModule('Backbone.Collection', ['Backbone', '_', 'Backbone.Events',
    'Backbone.Model', 'slice', 'Backbone.wrapError', 'Backbone.extend'],
    function (Backbone, _, Events, Model, slice, wrapError, extend) {
        "use strict";

        var Collection = function (models, options) {
                var opt = options || {};

                if (opt.model) {
                    this.model = opt.model;
                }
                if (opt.comparator !== undefined) {
                    this.comparator = opt.comparator;
                }
                this._reset();
                this.initialize.apply(this, arguments);
                if (models) {
                    this.reset(models, _.extend({silent: true}, opt));
                }
            },
        // Default options for `Collection#set`.
            setOptions = {add: true, remove: true, merge: true},
            addOptions = {add: true, remove: false},
        // Underscore methods that we want to implement on the Collection.
        // 90% of the core usefulness of Backbone Collections is actually implemented
        // right here:
            methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
                'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
                'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
                'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
                'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
                'lastIndexOf', 'isEmpty', 'chain', 'sample', 'partition'],
        // Underscore methods that take a property name as an argument.
            attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];


        // Define the Collection's inheritable methods.
        _.extend(Collection.prototype, Events, {

            // The default model for a collection is just a **Backbone.Model**.
            // This should be overridden in most cases.
            model: Model,

            // Initialize is an empty function by default. Override it with your own
            // initialization logic.
            initialize: function () {
            },

            // The JSON representation of a Collection is an array of the
            // models' attributes.
            toJSON: function (options) {
                return this.map(function (model) {
                    return model.toJSON(options);
                });
            },

            // Proxy `Backbone.sync` by default.
            sync: function () {
                return Backbone.sync.apply(this, arguments);
            },

            // Add a model, or list of models to the set.
            add: function (models, options) {
                return this.set(models, _.extend({merge: false}, options, addOptions));
            },

            // Remove a model, or a list of models from the set.
            remove: function (models, options) {
                var singular = !_.isArray(models),
                    i,
                    length,
                    model,
                    index;

                models = singular ? [models] : _.clone(models);
                options = options || {};

                for (i = 0, length = models.length; i < length; i += 1) {
                    model = models[i] = this.get(models[i]);
                    if (model) {
                        delete this._byId[model.id];
                        delete this._byId[model.cid];

                        index = this.indexOf(model);

                        this.models.splice(index, 1);
                        this.length -= 1;
                        if (!options.silent) {
                            options.index = index;
                            model.trigger('remove', model, this, options);
                        }
                        this._removeReference(model, options);
                    }
                }
                return singular ? models[0] : models;
            },

            // Update a collection by `set`-ing a new list of models, adding new ones,
            // removing models that are no longer present, and merging models that
            // already exist in the collection, as necessary. Similar to **Model#set**,
            // the core operation for updating the data contained by the collection.
            set: function (models, options) {
                options = _.defaults({}, options, setOptions);

                var singular, id, model, attrs, existing, sort, at = options.at,
                    sortable, sortAttr, toAdd = [], toRemove = [], modelMap = {},
                    add = options.add, merge = options.merge, remove = options.remove,
                    order, targetProto, i, length, orderedModels;

                if (options.parse) {
                    models = this.parse(models, options);
                }
                singular = !_.isArray(models);
                models = singular ? (models ? [models] : []) : models.slice();
                sortable = this.comparator && (at === undefined) && options.sort !== false;
                sortAttr = _.isString(this.comparator) ? this.comparator : null;
                order = !sortable && add && remove ? [] : false;
                targetProto = this.model.prototype;

                // Turn bare objects into model references, and prevent invalid models
                // from being added.
                for (i = 0, length = models.length; i < length; i += 1) {
                    attrs = models[i] || {};
                    if (this._isModel(attrs)) {
                        id = model = attrs;
                    } else if (targetProto.generateId) {
                        id = targetProto.generateId(attrs);
                    } else {
                        id = attrs[targetProto.idAttribute || Model.prototype.idAttribute];
                    }

                    // If a duplicate is found, prevent it from being added and
                    // optionally merge it into the existing model.
                    existing = this.get(id);
                    if (existing) {
                        if (remove) {
                            modelMap[existing.cid] = true;
                        }
                        if (merge) {
                            attrs = attrs === model ? model.attributes : attrs;
                            if (options.parse) {
                                attrs = existing.parse(attrs, options);
                            }
                            existing.set(attrs, options);
                            if (sortable && !sort && existing.hasChanged(sortAttr)) {
                                sort = true;
                            }
                        }
                        models[i] = existing;

                        // If this is a new, valid model, push it to the `toAdd` list.
                    } else if (add) {
                        model = models[i] = this._prepareModel(attrs, options);
                        if (model) {
                            toAdd.push(model);
                            this._addReference(model, options);
                        }
                    }

                    // Do not add multiple models with the same `id`.
                    model = existing || model;

                    if (model) {
                        if (order && (model.isNew() || !modelMap[model.id])) {
                            order.push(model);
                        }
                        modelMap[model.id] = true;
                    }
                }

                // Remove nonexistent models if appropriate.
                if (remove) {
                    for (i = 0, length = this.length; i < length; i += 1) {
                        if (!modelMap[(model = this.models[i]).cid]) {
                            toRemove.push(model);
                        }
                    }
                    if (toRemove.length) {
                        this.remove(toRemove, options);
                    }
                }

                // See if sorting is needed, update `length` and splice in new models.
                if (toAdd.length || (order && order.length)) {
                    if (sortable) {
                        sort = true;
                    }
                    this.length += toAdd.length;
                    if (at !== undefined) {
                        for (i = 0, length = toAdd.length; i < length; i += 1) {
                            this.models.splice(at + i, 0, toAdd[i]);
                        }
                    } else {
                        if (order) {
                            this.models.length = 0;
                        }
                        orderedModels = order || toAdd;
                        for (i = 0, length = orderedModels.length; i < length; i += 1) {
                            this.models.push(orderedModels[i]);
                        }
                    }
                }

                // Silently sort the collection if appropriate.
                if (sort) {
                    this.sort({silent: true});
                }

                // Unless silenced, it's time to fire all appropriate add/sort events.
                if (!options.silent) {
                    for (i = 0, length = toAdd.length; i < length; i += 1) {
                        (model = toAdd[i]).trigger('add', model, this, options);
                    }
                    if (sort || (order && order.length)) {
                        this.trigger('sort', this, options);
                    }
                }

                // Return the added (or merged) model (or models).
                return singular ? models[0] : models;
            },

// When you have more items than you want to add or remove individually,
// you can reset the entire set with a new list of models, without firing
// any granular `add` or `remove` events. Fires `reset` when finished.
// Useful for bulk operations and optimizations.
            reset: function (models, options) {
                options = options || {};
                var i, length;

                for (i = 0, length = this.models.length; i < length; i += 1) {
                    this._removeReference(this.models[i], options);
                }

                options.previousModels = this.models;

                this._reset();

                models = this.add(models, _.extend({silent: true}, options));

                if (!options.silent) {
                    this.trigger('reset', this, options);
                }

                return models;
            },

// Add a model to the end of the collection.
            push: function (model, options) {
                return this.add(model, _.extend({at: this.length}, options));
            },

// Remove a model from the end of the collection.
            pop: function (options) {
                var model = this.at(this.length - 1);

                this.remove(model, options);

                return model;
            },

// Add a model to the beginning of the collection.
            unshift: function (model, options) {
                return this.add(model, _.extend({at: 0}, options));
            },

// Remove a model from the beginning of the collection.
            shift: function (options) {
                var model = this.at(0);

                this.remove(model, options);

                return model;
            },

// Slice out a sub-array of models from the collection.
            slice: function () {
                return slice.apply(this.models, arguments);
            },

// Get a model from the set by id.
            get: function (obj) {
                if (obj === null || obj === undefined) {
                    return undefined;
                }

                return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
            },

// Get the model at the given index.
            at: function (index) {
                return this.models[index];
            },

// Return models with matching attributes. Useful for simple cases of
// `filter`.
            where: function (attrs, first) {
                if (_.isEmpty(attrs)) {
                    return first ? undefined : [];
                }

                return this[first ? 'find' : 'filter'](function (model) {
                    var key;

                    for (key in attrs) {
                        if (attrs.hasOwnProperty(key)) {
                            if (attrs[key] !== model.get(key)) {
                                return false;
                            }
                        }
                    }
                    return true;
                });
            },

// Return the first model with matching attributes. Useful for simple cases
// of `find`.
            findWhere: function (attrs) {
                return this.where(attrs, true);
            },

// Force the collection to re-sort itself. You don't need to call this under
// normal circumstances, as the set will maintain sort order as each item
// is added.
            sort: function (options) {
                if (!this.comparator) {
                    throw new Error('Cannot sort a set without a comparator');
                }

                options = options || {};

                // Run sort based on type of `comparator`.
                if (_.isString(this.comparator) || this.comparator.length === 1) {
                    this.models = this.sortBy(this.comparator, this);
                } else {
                    this.models.sort(_.bind(this.comparator, this));
                }

                if (!options.silent) {
                    this.trigger('sort', this, options);
                }

                return this;
            },

// Pluck an attribute from each model in the collection.
            pluck: function (attr) {
                return _.invoke(this.models, 'get', attr);
            },

// Fetch the default set of models for this collection, resetting the
// collection when they arrive. If `reset: true` is passed, the response
// data will be passed through the `reset` method instead of `set`.
            fetch: function (options) {
                options = options ? _.clone(options) : {};
                if (options.parse === undefined) {
                    options.parse = true;
                }
                var success = options.success,
                    collection = this,
                    method;

                options.success = function (resp) {
                    method = options.reset ? 'reset' : 'set';
                    collection[method](resp, options);

                    if (success) {
                        success(collection, resp, options);
                    }

                    collection.trigger('sync', collection, resp, options);
                };

                wrapError(this, options);

                return this.sync('read', this, options);
            },

// Create a new instance of a model in this collection. Add the model to the
// collection immediately, unless `wait: true` is passed, in which case we
// wait for the server to agree.
            create: function (model, options) {
                options = options ? _.clone(options) : {};

                if ((model = this._prepareModel(model, options)) === false) {
                    return false;
                }
                if (!options.wait) {
                    this.add(model, options);
                }

                var collection = this,
                    success = options.success;

                options.success = function (model, resp) {
                    if (options.wait) {
                        collection.add(model, options);
                    }
                    if (success) {
                        success(model, resp, options);
                    }
                };

                model.save(null, options);

                return model;
            },

// **parse** converts a response into a list of models to be added to the
// collection. The default implementation is just to pass it through.
            parse: function (resp, options) {
                return resp;
            },

// Create a new collection with an identical list of models as this one.
            clone: function () {
                return new this.constructor(this.models, {
                    model: this.model,
                    comparator: this.comparator
                });
            },

// Private method to reset all internal state. Called when the collection
// is first initialized or reset.
            _reset: function () {
                this.length = 0;
                this.models = [];
                this._byId = {};
            },

// Prepare a hash of attributes (or other model) to be added to this
// collection.
            _prepareModel: function (attrs, options) {
                if (this._isModel(attrs)) {
                    if (!attrs.collection) {
                        attrs.collection = this;
                    }
                    return attrs;
                }
                options = options ? _.clone(options) : {};
                options.collection = this;
                var model = new this.model(attrs, options);

                if (!model.validationError) {
                    return model;
                }

                this.trigger('invalid', this, model.validationError, options);

                return false;
            },

// Method for checking whether an object should be considered a model for
// the purposes of adding to the collection.
            _isModel: function (model) {
                return model instanceof Model;
            },

// Internal method to create a model's ties to a collection.
            _addReference: function (model, options) {
                this._byId[model.cid] = model;

                if (model.id !== null && model.id !== undefined) {
                    this._byId[model.id] = model;
                }

                model.on('all', this._onModelEvent, this);
            },

// Internal method to sever a model's ties to a collection.
            _removeReference: function (model, options) {
                if (this === model.collection) {
                    delete model.collection;
                }

                model.off('all', this._onModelEvent, this);
            },

// Internal method called every time a model in the set fires an event.
// Sets need to update their indexes when models change ids. All other
// events simply proxy through. "add" and "remove" events that originate
// in other collections are ignored.
            _onModelEvent: function (event, model, collection, options) {
                if ((event === 'add' || event === 'remove') && collection !== this) {
                    return;
                }
                if (event === 'destroy') {
                    this.remove(model, options);
                }
                if (event === 'change-id') {
                    if (collection !== null && collection !== undefined) {
                        delete this._byId[collection];
                    }
                    if (model.id !== null && model.id !== undefined) {
                        this._byId[model.id] = model;
                    }
                }
                this.trigger.apply(this, arguments);
            }

        });

// Mix in each Underscore method as a proxy to `Collection#models`.
        _.each(methods, function (method) {
            if (!_[method]) {
                return;
            }

            Collection.prototype[method] = function () {
                var args = slice.call(arguments);
                args.unshift(this.models);
                return _[method].apply(_, args);
            };
        });

// Use attributes instead of properties.
        _.each(attributeMethods, function (method) {
            if (!_[method]) {
                return;
            }
            Collection.prototype[method] = function (value, context) {
                var iterator = _.isFunction(value) ? value : function (model) {
                    return model.get(value);
                };
                return _[method](this.models, iterator, context);
            };
        });

        Collection.extend = extend;

        return Collection;
    });
