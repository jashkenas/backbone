###*
  Backbone.View
  -------------

  Backbone Views are almost more convention than they are actual code. A View
  is simply a JavaScript object that represents a logical chunk of UI in the
  DOM. This might be a single item, an entire list, a sidebar or panel, or
  even the surrounding frame which wraps your whole app. Defining a chunk of
  UI as a **View** allows you to define your DOM events declaratively, without
  having to worry about render order ... and makes it easy for the view to
  react to specific changes in the state of your models.

  Options with special meaning *(e.g. model, collection, id, className)* are
  attached directly to the view.  See `viewOptions` for an exhaustive
  list.

  Creating a Backbone.View creates its initial element outside of the DOM,
  if an existing element is not provided...
###

# Cached regex to split keys for `delegate`.
delegateEventSplitter = /^(\S+)\s*(.*)$/

# List of view options to be merged as properties.
viewOptions = [
  'model'
  'collection'
  'el'
  'id'
  'attributes'
  'className'
  'tagName'
  'events'
]

class Backbone.View
  _.extend @::, Events
  
  # The default `tagName` of a View's element is `"div"`.
  tagName: 'div'
  
  constructor: (options = {}) ->
    @cid = _.uniqueId 'view'
    _.extend @, _.pick(options, viewOptions)
    @_ensureElement()
    @initialize.apply @, arguments
    @delegateEvents()

  # jQuery delegate for element lookup, scoped to DOM elements within the
  # current view. This should be prefered to global lookups where possible.
  $: (selector) -> @$el.find selector

  # Initialize is an empty function by default. Override it with your own
  # initialization logic.
  initialize: ->
    # pass

  # **render** is the core function that your view should override, in order
  # to populate its element (`this.el`), with the appropriate HTML. The
  # convention is for **render** to always return `this`.
  render: -> @
  
  # Remove this view by taking the element out of the DOM, and removing any
  # applicable Backbone.Events listeners.
  remove: ->
    @$el.remove()
    @stopListening()
    @

  # Change the view's element (`this.el` property), including event
  # re-delegation.
  setElement: (element, delegate) ->
    @undelegateEvents() if @$el
    @$el = if element instanceof Backbone.$ then element else Backbone.$(element)
    @el = @$el[0]
    @delegateEvents() if delegate != false
    @
    
  # Set callbacks, where `this.events` is a hash of
  #
  # *{"event selector": "callback"}*
  #
  #     {
  #       'mousedown .title':  'edit',
  #       'click .button':     'save'
  #       'click .open':       function(e) { ... }
  #     }
  #
  # pairs. Callbacks will be bound to the view, with `this` set properly.
  # Uses event delegation for efficiency.
  # Omitting the selector binds the event to `this.el`.
  # This only works for delegate-able events: not `focus`, `blur`, and
  # not `change`, `submit`, and `reset` in Internet Explorer.
  delegateEvents: (events) ->
    events = events or _.result @, 'events'
    return @ if !events
    @undelegateEvents()
    for key, method of events
      method = @[events[key]] if !_.isFunction method
      continue if !method
      match = key.match delegateEventSplitter
      eventName = match[1]
      selector = match[2]
      method = _.bind method, @
      eventName += ".delegateEvents#{@cid}"
      if selector == ''
        @$el.on eventName, method
      else
        @$el.on eventName, selector, method
    @

  # Clears all callbacks previously bound to the view with `delegateEvents`.
  # You usually don't need to use this, but may wish to if you have multiple
  # Backbone views attached to the same DOM element.
  undelegateEvents: ->
    @$el.off '.delegateEvents' + @cid
    @
  
  # Ensure that the View has a DOM element to render into.
  # If `this.el` is a string, pass it through `$()`, take the first
  # matching element, and re-assign it to `el`. Otherwise, create
  # an element from the `id`, `className` and `tagName` properties.
  _ensureElement: ->
    if !@el
      attrs = _.extend {}, _.result(@, 'attributes')
      attrs.id = _.result(@, 'id') if @id
      attrs['class'] = _.result(@, 'className') if @className
      $el = Backbone.$('<' + _.result(@, 'tagName') + '>').attr attrs
      @setElement $el, false
    else
      @setElement _.result(@, 'el'), false

View = Backbone.View
