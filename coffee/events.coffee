###*
  Backbone.Events
  ---------------

  A module that can be mixed in to *any object* in order to provide it with
  custom events. You may bind with `on` or remove with `off` callback
  functions to an event; `trigger`-ing an event fires all callbacks in
  succession.

      var object = {};
      _.extend(object, Backbone.Events);
      object.on('expand', function(){ alert('expanded'); });
      object.trigger('expand');
###
class Backbone.Events
  # Bind an event to a `callback` function. Passing `"all"` will bind
  # the callback to all events fired.
  @on: (name, callback, context) ->
    return @ if !eventsApi(@, 'on', name, [callback, context]) or !callback
    @_events ?= {}
    @_events[name] ?= []
    events = @_events[name]
    events.push
      callback: callback
      context: context
      ctx: context or @
    @
  # Bind an event to only be triggered a single time. After the first time
  # the callback is invoked, it will be removed.
  @once: (name, callback, context) ->
    return @ if !eventsApi(@, 'once', name, [callback, context]) or !callback
    self = @
    once = _.once(->
      self.off name, once
      callback.apply @, arguments
    )
    once._callback = callback
    @on name, once, context
  # Remove one or many callbacks. If `context` is null, removes all
  # callbacks with that function. If `callback` is null, removes all
  # callbacks for the event. If `name` is null, removes all bound
  # callbacks for all events.
  @off: (name, callback, context) ->
    return @ if !@_events or !eventsApi @, 'off', name, [callback, context]
    if !name and !callback and !context
      @_events = {}
      return @
    names = if name then [name] else _.keys @_events
    for i in [0...names.length]
      name = names[i]
      events = @_events[name]
      if events
        retain = []
        @_events[name] = retain
        if callback or context
          for j in [0...events.length]
            ev = events[j]
            if (callback and callback != ev.callback and callback != ev.callback._callback) or (context and context != ev.context)
              retain.push ev
        delete @_events[name] if !retain.length
    @
  # Trigger one or many events, firing all bound callbacks. Callbacks are
  # passed the same arguments as `trigger` is, apart from the event name
  # (unless you're listening on `"all"`, which will cause your callback to
  # receive the true name of the event as the first argument).
  @trigger: (name) ->
    return @ if !@_events
    args = slice.call arguments, 1
    return @ if !eventsApi @, 'trigger', name, args
    events = @_events[name]
    allEvents = @_events.all
    triggerEvents(events, args) if events
    triggerEvents(allEvents, arguments) if allEvents
    @
  # Tell this object to stop listening to either specific events ... or
  # to every object it's currently listening to.
  @stopListening: (obj, name, callback) ->
    listeners = @_listeners
    return @ if !listeners
    deleteListener = !name and !callback
    callback = @ if _.isObject name
    if obj
      listeners = {}
      listeners[obj._listenerId] = obj
    for id, v of listeners
      listeners[id].off(name, callback, @)
      delete @_listeners[id] if deleteListener
    @

Events = Backbone.Events

# Regular expression used to split event strings.
eventSplitter = /\s+/

# Implement fancy features of the Events API such as multiple event
# names `"change blur"` and jQuery-style event maps `{change: action}`
# in terms of the existing API.
eventsApi = (obj, action, name, rest) ->
  return true if !name
  # Handle event maps.
  if _.isObject name
    for key, v of name
      obj[action].apply obj, [key, name[key]].concat(rest)
    return false
  # Handle space separated event names.
  if eventSplitter.test name
    names = name.split eventSplitter
    for i in [0...names.length]
      obj[action].apply obj, [names[i]].concat(rest)
    return false
  true

# A difficult-to-believe, but optimized internal dispatch function for
# triggering events. Tries to keep the usual cases speedy (most internal
# Backbone events have 3 arguments).
triggerEvents = (events, args) ->
  i = -1
  l = events.length
  a1 = args[0]
  a2 = args[1]
  a3 = args[2]
  switch args.length
    when 0
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx
    when 1
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx, a1
    when 2
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx, a1, a2
    when 3
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx, a1, a2, a3
    else
      while ++i < l
        ev = events[i]
        ev.callback.apply ev.ctx, args

listenMethods =
  listenTo: 'on'
  listenToOnce: 'once'

# Inversion-of-control versions of `on` and `once`. Tell *this* object to
# listen to an event in another object ... keeping track of what it's
# listening to.
_.each listenMethods, (implementation, method) ->
  Events[method] = (obj, name, callback) ->
    @_listeners ?= {}
    listeners = @_listeners
    obj._listenerId ?= _.uniqueId 'l'
    id = obj._listenerId
    listeners[id] = obj
    callback = this if _.isObject name
    obj[implementation] name, callback, @
    @

# Aliases for backwards compatibility.
Events.bind = Events.on
Events.unbind = Events.off

# Allow the `Backbone` object to serve as a global event bus, for folks who
# want global "pubsub" in a convenient place.
_.extend Backbone, Events
