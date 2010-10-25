// Example Backbone App contributed by Jérôme Gravel-Niquet.

// Load the application once the DOM is ready:
$(function(){

  // Our basic **Todo** model. Has `content`, `order`, and `done` attributes.
  window.Todo = Backbone.Model.extend({
    
    // Ensure each todo is created with the content field filled in.
    initialize : function(){
      if(!this.get("content")) this.set({"content": "New Todo"}, {silent:true})
    },
    
    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    },

    // Remove this Todo from *localStorage*, deleting its view.
    clear: function() {
      this.destroy();
      $(this.view.el).remove();
    }

  });

  // The collection of Todos. Backed by *localStorage* instead of a remote
  // server.
  window.TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,

    // Save all of the todo items under the `"todos"` namespace.
    localStore: "todos",

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }

  });

  // Create our global collection of **Todos**.
  window.Todos = new TodoList;

  // The view for a single Todo item...
  window.TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single todo.
    template: _.template($('#item-template').html()),

    // The DOM events specific to a todo item.
    events: {
      "click .check"              : "toggleDone",
      "dblclick div.todo-content" : "edit",
      "click span.todo-destroy"   : "clear",
      "keypress .todo-input"      : "updateOnEnter"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setContent();
      return this;
    },

    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the todo item.
    setContent: function() {
      var content = this.model.get('content');
      this.$('.todo-content').text(content);
      this.$('.todo-input').val(content);
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
    },

    // If you hit enter, submit the changes to the todo item.
    updateOnEnter: function(e) {
      if (e.keyCode != 13) return;
      this.model.save({content: this.$(".todo-input").val()});
      $(this.el).removeClass("editing");
    },

    clear: function() {
      this.model.clear();
    }

  });

  window.AppView = Backbone.View.extend({

    el: $("#todoapp"),

    template: _.template($('#stats-template').html()),

    events: {
      "keypress #new-todo":  "createOnEnter",
      "keyup #new-todo":     "showTooltip",
      "click .todo-clear a": "clearCompleted"
    },

    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'render');

      this.input    = this.$("#new-todo");

      Todos.bind('add',     this.addOne);
      Todos.bind('refresh', this.addAll);
      Todos.bind('all',     this.render);

      Todos.fetch();
    },

    render: function() {
      var done = Todos.done().length;
      this.$('#todo-stats').html(this.template({
        done:       done,
        total:      Todos.length,
        remaining:  Todos.length - done
      }));
    },

    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    addAll: function() {
      Todos.each(this.addOne);
    },

    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      Todos.create({
        content: this.input.val(),
        order:   Todos.nextOrder(),
        done:    false
      });
      this.input.val('');
    },

    showTooltip: function(e) {
      var tooltip = this.$(".ui-tooltip-top");
      tooltip.fadeOut();

      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

      if (this.input.val() !== "" && this.input.val() !== this.input.attr('placeholder')) {
        this.tooltipTimeout = setTimeout(function(){
          tooltip.show().fadeIn();
        }, 1000);
      }
    },

    clearCompleted: function() {
      _.each(Todos.done(), function(todo){ todo.clear(); });
      return false;
    }

  });

  window.App = new AppView;

});
