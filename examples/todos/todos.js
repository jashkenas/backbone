$(function(){

  // Todo
  window.Todo = Backbone.Model.extend({

    parse: function(resp) {
      return resp.model;
    },

    htmlId: function() {
      return "todo-" + this.id;
    }

  });

  // Todo List
  window.TodoList = Backbone.Collection.extend({

    model: Todo,
    localStore: new Store("tasks"),

    // Returns all done todos.
    done: function() {
      return this.select(function(todo){
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
    }

  });

  window.Todos = new TodoList;

  window.TodoView = Backbone.View.extend({

    tagName:    "li",

    template:   _.template($('#item-template').html()),

    events: {
      "click input[type=checkbox]": "markAsDone",
      "dblclick div.todo-content" : "edit",
      "click span.todo-destroy"   : "destroy",
      "keypress .todo-input"      : "changed"
    },

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.el.id = this.model.htmlId();
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

    markAsDone: function() {
      this.model.save({ done: !this.model.get("done") });
    },

    edit: function() {
      this.$('.todo').addClass("editing");
      this.updateInput = this.$("input[type=text]");
    },

    changed: function(e) {
      if (e.keyCode == 13) {
        this.model.save({content: this.updateInput.val()});
      }
    },

    destroy: function() {
      var thisView = this;
      this.model.destroy({
        success: function(){
          $(thisView.el).remove();
        }
      });
    }

  });

  window.AppView = Backbone.View.extend({

    el: $("#todoapp"),

    events: {
      "keypress input#new-todo":  "createIfEnter",
      "keyup input#new-todo":     "showTooltip",
      "click span.todo-clear":    "clearCompleted"
    },

    initialize: function() {
      _.bindAll(this, 'addTodo', 'clearCompleted', 'showTooltip', 'createIfEnter', 'analyzeTodos');

      Todos.bind('add', this.addTodo);

      this.list       = $("#todo-list");
      this.newInput   = $("#new-todo");
      this.tooltip    = this.$(".ui-tooltip-top");

      Todos.fetch({
        success: _.bind(function(coll) {
          _.each(coll.models, this.addTodo);
        }, this)
      });

      this.analyzeTodos();

      Todos.bind("add", this.analyzeTodos);
      Todos.bind("remove", this.analyzeTodos);
      Todos.bind("change", this.analyzeTodos);
    },

    analyzeTodos: function() {
      var doneCount = Todos.done().length;
      var todoCount = Todos.length;
      var totalCount = todoCount - doneCount;

      this.$(".number").text(totalCount);
      this.$(".word").text(totalCount == 1 ? 'item' : 'items');
      this.$("span.todo-count").css({display: todoCount > 0 ? "inline" : "none"});
      this.$("span.todo-clear").css({display: doneCount > 0 ? "inline" : "none"});
    },

    addTodo: function(todo) {
      var view = new TodoView({model: todo});
      this.list.append(view.render().el);
    },

    createIfEnter: function(e) {
      if (e.keyCode == 13) {
        Todos.create({
          content: this.newInput.val(),
          order:   Todos.nextOrder(),
          done:    false
        });
        this.newInput.val('');
      }
    },

    showTooltip: function(e) {
      this.tooltip.fadeOut();

      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

      var tt = this.tooltip;

      if (this.newInput.val() !== "" && this.newInput.val() !== this.newInput.attr('placeholder')) {
        this.tooltipTimeout = setTimeout(function(){
          tt.show().fadeIn();
        }, 1000);
      }
    },

    clearCompleted: function() {
      thisView = this;
      _.each(Todos.done(), function(todo){
        todo.destroy({success: function(todo){
          thisView.$("#todo-"+todo.id).remove();
        }});
      });
    }

  });

  window.App = new AppView;

});