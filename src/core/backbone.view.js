/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Backbone.View
// -------------

// Backbone Views are almost more convention than they are actual code. A View
// is simply a JavaScript object that represents a logical chunk of UI in the
// DOM. This might be a single item, an entire list, a sidebar or panel, or
// even the surrounding frame which wraps your whole app. Defining a chunk of
// UI as a **View** allows you to define your DOM events declaratively, without
// having to worry about render order ... and makes it easy for the view to
// react to specific changes in the state of your models.

// Creating a Backbone.View creates its initial element outside of the DOM,
// if an existing element is not provided...
Backbone.registerModule('Backbone.View', ['Backbone', '_', 'Backbone.Events'],
    function (Backbone, _, Events) {
        "use strict";

        var // List of view options to be merged as properties.
            viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'],
            View = function (options) {
                var opt = options || {};
                this.cid = _.uniqueId('view');
                _.extend(this, _.pick(opt, viewOptions));
                this._ensureElement();
                this.initialize.apply(this, arguments);
            },
        // Cached regex to split keys for `delegate`.
            delegateEventSplitter = /^(\S+)\s*(.*)$/;

        // Set up all inheritable **Backbone.View** properties and methods.
        _.extend(View.prototype, Events, {

            // The default `tagName` of a View's element is `"div"`.
            tagName: 'div',

            // jQuery delegate for element lookup, scoped to DOM elements within the
            // current view. This should be preferred to global lookups where possible.
            $: function (selector) {
                return this.$el.find(selector);
            },

            // Initialize is an empty function by default. Override it with your own
            // initialization logic.
            initialize: function () {
            },

            // **render** is the core function that your view should override, in order
            // to populate its element (`this.el`), with the appropriate HTML. The
            // convention is for **render** to always return `this`.
            render: function () {
                return this;
            },

            // Remove this view by taking the element out of the DOM, and removing any
            // applicable Backbone.Events listeners.
            remove: function () {
                this._removeElement();
                this.stopListening();
                return this;
            },

            // Remove this view's element from the document and all event listeners
            // attached to it. Exposed for subclasses using an alternative DOM
            // manipulation API.
            _removeElement: function () {
                this.$el.remove();
            },

            // Change the view's element (`this.el` property) and re-delegate the
            // view's events on the new element.
            setElement: function (element) {
                this.undelegateEvents();
                this._setElement(element);
                this.delegateEvents();
                return this;
            },

            // Creates the `this.el` and `this.$el` references for this view using the
            // given `el` and a hash of `attributes`. `el` can be a CSS selector or an
            // HTML string, a jQuery context or an element. Subclasses can override
            // this to utilize an alternative DOM manipulation API and are only required
            // to set the `this.el` property.
            _setElement: function (el) {
                this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
                this.el = this.$el[0];
            },

            // Set callbacks, where `this.events` is a hash of
            //
            // *{"event selector": "callback"}*
            //
            //     {
            //       'mousedown .title':  'edit',
            //       'click .button':     'save',
            //       'click .open':       function(e) { ... }
            //     }
            //
            // pairs. Callbacks will be bound to the view, with `this` set properly.
            // Uses event delegation for efficiency.
            // Omitting the selector binds the event to `this.el`.
            delegateEvents: function (events) {
                var evt = events || _.result(this, 'events'),
                    key,
                    method,
                    match;
                if (!evt) {
                    return this;
                }
                this.undelegateEvents();
                for (key in evt) {
                    if (evt.hasOwnProperty(key)) {
                        method = evt[key];
                        if (!_.isFunction(method)) {
                            method = this[evt[key]];
                        }
                        if (method) {
                            match = key.match(delegateEventSplitter);
                            this.delegate(match[1], match[2], _.bind(method, this));
                        }
                    }
                }
                return this;
            },

            // Add a single event listener to the view's element (or a child element
            // using `selector`). This only works for delegate-able events: not `focus`,
            // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
            delegate: function (eventName, selector, listener) {
                this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
            },

            // Clears all callbacks previously bound to the view by `delegateEvents`.
            // You usually don't need to use this, but may wish to if you have multiple
            // Backbone views attached to the same DOM element.
            undelegateEvents: function () {
                if (this.$el) {
                    this.$el.off('.delegateEvents' + this.cid);
                }
                return this;
            },

            // A finer-grained `undelegateEvents` for removing a single delegated event.
            // `selector` and `listener` are both optional.
            undelegate: function (eventName, selector, listener) {
                this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
            },

            // Produces a DOM element to be assigned to your view. Exposed for
            // subclasses using an alternative DOM manipulation API.
            _createElement: function (tagName) {
                return document.createElement(tagName);
            },

            // Ensure that the View has a DOM element to render into.
            // If `this.el` is a string, pass it through `$()`, take the first
            // matching element, and re-assign it to `el`. Otherwise, create
            // an element from the `id`, `className` and `tagName` properties.
            _ensureElement: function () {
                if (!this.el) {
                    var attrs = _.extend({}, _.result(this, 'attributes'));
                    if (this.id) {
                        attrs.id = _.result(this, 'id');
                    }
                    if (this.className) {
                        attrs['class'] = _.result(this, 'className');
                    }
                    this.setElement(this._createElement(_.result(this, 'tagName')));
                    this._setAttributes(attrs);
                } else {
                    this.setElement(_.result(this, 'el'));
                }
            },

            // Set attributes from a hash on this view's element.  Exposed for
            // subclasses using an alternative DOM manipulation API.
            _setAttributes: function (attributes) {
                this.$el.attr(attributes);
            }

        });

        View.extend = Backbone.extend;

        return View;
    });
