(function () {

  // ### Models

  // Our main model. It is simple enough that it doesn't need any prototype
  // methods.
  window.Task = Backbone.Model.extend({});

  // A Collection wrapper for Task instances.
  window.TaskCollection = Backbone.Collection.extend({
    model: Task
  });

  // ### Views

  // The TaskView is a View that handles the rendering and events of a single
  // Task instance. You can double click on the task's text to edit it's content
  // in a text box and tick the checkbox on or off to mark whether it is
  // complete or not.
  window.TaskView = Backbone.View.extend({

    tagName: "li",

    className: "todo",

    displayTemplate:  _.template($('#todo-template').html()),
    editTemplate:     _.template($('#edit-template').html()),

    events: {
      "dblclick span": "edit",
      "click input[type=checkbox]": "toggle",
      "click input.update": "changed"
    },

    initialize: function (opts) {
      _.bindAll(this, 'setComplete');
      this.model.bind('change:complete', this.setComplete);
      this.handleEvents(); // Bind the event delegators.
    },

    // Render (or empty and re-render) this view. If this task is complete,
    // make the text have strike through.
    render: function () {
      $(this.el).html(this.displayTemplate({model: this.model}));
      this.setComplete();
      return this;
    },

    setComplete: function() {
      $(this.el).toggleClass('complete', this.model.get('complete'));
    },

    // Switch this view from display mode in to edit mode. Provide a text input
    // to edit this task's content and a submit button to click to save the
    // updates.
    edit: function () {
      $(this.el).html(this.editTemplate({model : this.model}));
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
    // complete or not and let render() take care of strike-through.
    toggle: function () {
      this.model.set({ complete: !this.model.get("complete") });
    }
  });

  // The TodoListApp is the main view for this application. It handles creation
  // of new Tasks, clearing complete tasks, and supervises the individual
  // TaskViews.
  window.TodoListApp = Backbone.View.extend({
    tagName: "div",
    events: {
      "keypress input.new-task-input" : "maybeCreate",
      "click input.new-task"          : "create",
      "click input.clear"             : "clear"
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
          className: "new-task-input",
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
        complete: false
      });
      this.children.add(task);
      this.render();
    },

    maybeCreate: function(e) {
      if (e.keyCode == 13) this.create();
    },

    // Clear out all of the complete tasks and let render() handle removing
    // them from the page.
    clear: function () {
      var toBeRemoved = this.children
        .filter(function (task) {
          return task.get("complete");
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

    window.Tasks = new TaskCollection;
    window.App = new TodoListApp({
      children: Tasks
    });
    $("body").append(App.render().el);

  });

}());