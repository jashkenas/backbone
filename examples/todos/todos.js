$(function(){

  // Todo
  window.Todo = Backbone.Model.extend({

    parse: function(resp) {
      return resp.model;
    },

    htmlId: function() {
      return "todo-" + this.id;
    },

    remove: function() {
      this.destroy();
      $(this.view.el).remove();
    }

  });

  // Todo List
  window.TodoList = Backbone.Collection.extend({

    model: Todo,
    localStore: new Store("tasks"),

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
      "click span.todo-destroy"   : "remove",
      "keypress .todo-input"      : "changed"
    },

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.el.id = this.model.htmlId();
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
      this.model.save({done: !this.model.get("done")});
    },

    edit: function() {
      $(this.el).addClass("editing");
    },

    changed: function(e) {
      if (e.keyCode == 13) {
        this.model.save({content: this.$(".todo-input").val()});
        $(this.el).removeClass("editing");
      }
    },

    remove: function() {
      this.model.remove();
    }

  });

  window.AppView = Backbone.View.extend({

    el: $("#todoapp"),

    template: _.template($('#stats-template').html()),

    events: {
      "keypress #new-todo":  "createIfEnter",
      "keyup #new-todo":     "showTooltip",
      "click .todo-clear a": "clearCompleted"
    },

    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'clearCompleted', 'showTooltip',
        'createIfEnter', 'render');

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

    createIfEnter: function(e) {
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
      _.each(Todos.done(), function(todo){ todo.remove(); });
      return false;
    }

  });

  window.App = new AppView;

});