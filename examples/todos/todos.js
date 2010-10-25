// Example Backbone App contributed by Jérôme Gravel-Niquet.

// Load the application once the DOM is ready:
$(function(){

  // Our basic **Todo** model. Has `content`, `order`, and `done` attributes.
  window.Todo = Backbone.Model.extend({

    toggle: function() {
      this.save({done: !this.get("done")});
    },

    // Pull out the model's attributes from the the *localStorage* representation.
    parse: function(resp) {
      return resp.model;
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

    model: Todo,
    localStore: new Store("todos"),

    // Returns all done todos.
    done: function() {
      return this.filter(function(todo){
        return todo.get('done');
      });
    },

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(todo) {
      return todo.get('order');
    },

    parse: function(resp) {
      return resp.models;
    },

    pluralize: function(count) {
      return count == 1 ? 'item' : 'items';
    }

  });

  window.Todos = new TodoList;

  window.TodoView = Backbone.View.extend({

    tagName:  "li",

    template: _.template($('#item-template').html()),

    events: {
      "click .check"              : "toggleDone",
      "dblclick div.todo-content" : "edit",
      "click span.todo-destroy"   : "clear",
      "keypress .todo-input"      : "updateOnEnter"
    },

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setContent();
      return this;
    },

    setContent: function() {
      var content = this.model.get('content');
      this.$('.todo-content').text(content);
      this.$('.todo-input').val(content);
    },

    toggleDone: function() {
      this.model.toggle();
    },

    edit: function() {
      $(this.el).addClass("editing");
    },

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