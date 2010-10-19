(function () {

  // ### Models

  // Our main model. It is simple enough that it doesn't need any prototype
  // methods.
  var Task = Backbone.Model.extend({});

  // A Collection wrapper for Task instances.
  var TaskCollection = Backbone.Collection.extend({
    model: Task
  });

  // ### Views

  // The TaskView is a View that handles the rendering and events of a single
  // Task instance. You can double click on the task's text to edit it's content
  // in a text box and tick the checkbox on or off to mark whether it is
  // completed or not.
  var TaskView = Backbone.View.extend({
    tagName: "li",
    events: {
      "dblclick span": "edit",
      "click input[type=checkbox]": "toggle",
      "click input.update": "changed"
    },

    initialize: function (opts) {
      this.handleEvents(); // Bind the event delegators.
      this.model = opts.model;
    },

    // Render (or empty and re-render) this view. If this task is completed,
    // make the text have strike through.
    render: function () {
      this.$(this.el)
        .empty()
        .append(this.make("input", {
          type: "checkbox",
          checked: this.model.get("completed")
        }))
        .append(
          this.$(this.make("span"))
            .text(this.model.get("content"))
            .css("text-decoration",
                 this.model.get("completed")
                 ? "line-through"
                 : "none")
        );
      return this;
    },

    // Switch this view from display mode in to edit mode. Provide a text input
    // to edit this task's content and a submit button to click to save the
    // updates.
    edit: function () {
      var input = this.$(this.make("input", {
        type: "text",
        value: this.$(this.el).text()
      }));
      var submit = this.$(this.make("input", {
        type: "submit",
        className: "update",
        value: "Update"
      }));
      this.$(this.el)
        .empty()
        .append(input)
        .append(submit);
    },

    // Switch back to display mode after being in edit mode. Save the new
    // content for the model in the process.
    changed: function () {
      this.model.set({
        content: this.$("input[type=text]").val()
      });
      this.render();
    },

    // Event handler for ticking the checkbox. Just toggle whether the task is
    // completed or not and let render() take care of strike-through.
    toggle: function () {
      this.model.set({ completed: !this.model.get("completed") });
      this.render();
    }
  });

  // The TodoListApp is the main view for this application. It handles creation
  // of new Tasks, clearing completed tasks, and supervises the individual
  // TaskViews.
  var TodoListApp = Backbone.View.extend({
    tagName: "div",
    events: {
      "click input.new-task" : "create",
      "click input.clear"    : "clear"
    },

    initialize: function (opts) {
      this.handleEvents();
      this.children = opts.children;
    },

    render: function () {
      var me = this;
      me.$(me.el)
        .empty()
        .append(me.make("input", {
          type: "text",
          placeholder: "New task..."
        }))
        .append(me.make("input", {
          className: "new-task",
          type: "submit",
          value: "Add"
        }))
        .append(me.make("ul"))
        .append(me.make("input", {
          type: "submit",
          value: "Clear Completed Tasks",
          className: "clear"
        }));

      // Add a TaskView for each of out tasks.
      var list = me.$("ul");
      me.children
        .each(function (task) {
          var view = new TaskView({
            model: task
          });
          list.append(view.render().el);
        });
      return this;
    },

    // Create a new task, add it to the children, and let render() handle
    // creating a TaskView for it and displaying it.
    create: function () {
      var task = new Task({
        content: this.$("input[type=text]").val(),
        completed: false
      });
      this.children.add(task);
      this.render();
    },

    // Clear out all of the completed tasks and let render() handle removing
    // them from the page.
    clear: function () {
      var toBeRemoved = this.children
        .filter(function (task) {
          return task.get("completed");
        });

      var me = this;
      _(toBeRemoved).each(function (task) {
        me.children.remove(task);
      });

      this.render();
    }
  });

  // Initialize the app on document ready.

  $(document).ready(function () {

    var tasks = new TaskCollection;
    var app = new TodoListApp({
      children: tasks
    });
    $("body").append(app.render().el);

  });

}());