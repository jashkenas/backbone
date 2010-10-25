$(function(){

  // Todo
  window.Todo = Backbone.Model.extend({

    parse: function(resp) {
      return resp.model;
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

    comparator: function(todo) {
      return todo.id;
    },

    parse: function(resp) {
      return resp.models;
    }

  });

  window.Todos = new TodoList;

  window.TodoView = Backbone.View.extend({

    tagName: "li",
    className: "todo",

    template: _.template("<input type='checkbox' /><div class='todo-content'><%= content %></div><span class='todo-destroy'></span>"),
    editTemplate: _.template("<input type='text' value='<%= content %>' />"),

    events: {
      "click input[type=checkbox]": "markAsDone",
      "dblclick div.todo-content" : "edit",
      "click span.todo-destroy"   : "destroy",
      "keypress input[type=text]" : "changed"
    },

    initialize: function() {
      _.bindAll(this, 'toggleDone');
      this.model.bind('change:done', this.toggleDone);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      $(this.el).attr({id : "todo-"+this.model.get("id")});
      this.checkbox = this.$("input[type=checkbox]");
      this.toggleDone();
      return this;
    },

    toggleDone: function() {
      if (this.model.get('done')) {
        $(this.el).addClass("done");
        this.checkbox.attr({checked: "checked"});
      } else {
        $(this.el).removeClass("done");
        this.checkbox.attr({checked: null});
      }
    },

    markAsDone: function() {
      this.model.save({ done: !this.model.get("done") });
    },

    edit: function() {
      $(this.el).html(this.editTemplate(this.model.toJSON()));
      $(this.el).addClass("editing");
      this.updateInput = this.$("input[type=text]");
    },

    changed: function(e) {
      if (e.code == 13) {
        var thisView = this;
        this.model.save(
          {
            content: this.updateInput.val()
          },
          {
            success: function(todo) {
              thisView.render();
              $(thisView.el).removeClass("editing");
            }
          }
        );
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
      this.$(".word").text(totalCount == 1 ? 'todo' : 'todos');
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
          done: false
        });
        this.newInput.setProperty("value", "");
      }
    },

    showTooltip: function(e) {
      this.tooltip.fadeOut();

      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

      var tt = this.tooltip;

      if (this.newInput.val() !== "" && this.newInput.val() !== this.newInput.attr('placeholder')) {
        this.tooltipTimeout = setTimeout(function(){
          tt.fadeIn();
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