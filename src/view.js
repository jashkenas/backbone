var Events = require('./events'),
    helpers = require('./helpers');

// Creating a Backbone.View creates its initial element outside of the DOM,
// if an existing element is not provided...
module.exports = exports = function(options) {
  this.cid = _.uniqueId('view');
  this._configure(options || {});
  this._ensureElement();
  this.initialize.apply(this, arguments);
  this.delegateEvents();
};

exports.extend = helpers.extend;

// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;

// List of view options to be merged as properties.
var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName'];

// Set up all inheritable **Backbone.View** properties and methods.
_.extend(exports.prototype, Events, {

  // The default `tagName` of a View's element is `"div"`.
  tagName: 'div',

  // jQuery delegate for element lookup, scoped to DOM elements within the
  // current view. This should be prefered to global lookups where possible.
  $: function(selector) {
    return this.$el.find(selector);
  },

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function(){},

  // **render** is the core function that your view should override, in order
  // to populate its element (`this.el`), with the appropriate HTML. The
  // convention is for **render** to always return `this`.
  render: function() {
    return this;
  },

  // Clean up references to this view in order to prevent latent effects and
  // memory leaks.
  dispose: function() {
    this.undelegateEvents();
    if (this.model && this.model.off) this.model.off(null, null, this);
    if (this.collection && this.collection.off) this.collection.off(null, null, this);
    return this;
  },

  // Remove this view from the DOM. Note that the view isn't present in the
  // DOM by default, so calling this method may be a no-op.
  remove: function() {
    this.dispose();
    this.$el.remove();
    return this;
  },

  // For small amounts of DOM Elements, where a full-blown template isn't
  // needed, use **make** to manufacture elements, one at a time.
  //
  //     var el = this.make('li', {'class': 'row'}, this.model.escape('title'));
  //
  make: function(tagName, attributes, content) {
    var el = document.createElement(tagName);
    if (attributes) Backbone.$(el).attr(attributes);
    if (content != null) Backbone.$(el).html(content);
    return el;
  },

  // Change the view's element (`this.el` property), including event
  // re-delegation.
  setElement: function(element, delegate) {
    if (this.$el) this.undelegateEvents();
    this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
    this.el = this.$el[0];
    if (delegate !== false) this.delegateEvents();
    return this;
  },

  // Set callbacks, where `this.events` is a hash of
  //
  // *{"event selector": "callback"}*
  //
  //     {
  //       'mousedown .title':  'edit',
  //       'click .button':     'save'
  //       'click .open':       function(e) { ... }
  //     }
  //
  // pairs. Callbacks will be bound to the view, with `this` set properly.
  // Uses event delegation for efficiency.
  // Omitting the selector binds the event to `this.el`.
  // This only works for delegate-able events: not `focus`, `blur`, and
  // not `change`, `submit`, and `reset` in Internet Explorer.
  delegateEvents: function(events) {
    if (!(events || (events = _.result(this, 'events')))) return;
    this.undelegateEvents();
    for (var key in events) {
      var method = events[key];
      if (!_.isFunction(method)) method = this[events[key]];
      if (!method) throw new Error('Method "' + events[key] + '" does not exist');
      var match = key.match(delegateEventSplitter);
      var eventName = match[1], selector = match[2];
      method = _.bind(method, this);
      eventName += '.delegateEvents' + this.cid;
      if (selector === '') {
        this.$el.bind(eventName, method);
      } else {
        this.$el.delegate(selector, eventName, method);
      }
    }
  },

  // Clears all callbacks previously bound to the view with `delegateEvents`.
  // You usually don't need to use this, but may wish to if you have multiple
  // Backbone views attached to the same DOM element.
  undelegateEvents: function() {
    this.$el.unbind('.delegateEvents' + this.cid);
  },

  // Performs the initial configuration of a View with a set of options.
  // Keys with special meaning *(model, collection, id, className)*, are
  // attached directly to the view.
  _configure: function(options) {
    if (this.options) options = _.extend({}, this.options, options);
    for (var i = 0, l = viewOptions.length; i < l; i++) {
      var attr = viewOptions[i];
      if (options[attr]) this[attr] = options[attr];
    }
    this.options = options;
  },

  // Ensure that the View has a DOM element to render into.
  // If `this.el` is a string, pass it through `$()`, take the first
  // matching element, and re-assign it to `el`. Otherwise, create
  // an element from the `id`, `className` and `tagName` properties.
  _ensureElement: function() {
    if (!this.el) {
      var attrs = _.extend({}, _.result(this, 'attributes'));
      if (this.id) attrs.id = _.result(this, 'id');
      if (this.className) attrs['class'] = _.result(this, 'className');
      this.setElement(this.make(_.result(this, 'tagName'), attrs), false);
    } else {
      this.setElement(_.result(this, 'el'), false);
    }
  }

});
