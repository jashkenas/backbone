// ==========
// = Models =
// ==========

(function() {
    window.AB = {};
    AB.model = {};
    AB.view = {};
})();

AB.model.Person = Backbone.Model.extend({
    
    constructor : function(attributes) {
        Backbone.Model.call(this, attributes);
    }
    
});

AB.model.PeopleSet = Backbone.Collection.extend({
    
    model : AB.model.Person,
    
    comparator : function(person) {
        return [
            (person.get('lastName') || '').toLowerCase(),
            (person.get('firstName') || '').toLowerCase()
        ].join(' ');
    }
    
});

// =====================
// = Populating Models =
// =====================

AB.People = new AB.model.PeopleSet();
var person = new AB.model.Person({
    firstName : 'Samuel',
    lastName  : 'Clay',
    email     : 'samuel@ofbrooklyn.com',
    website   : 'http://www.samuelclay.com',
    twitter   : 'samuelclay'
});
AB.People.add(person);

// =========
// = Views =
// =========

AB.view.Person = Backbone.View.extend({
    
    constructor : function(options) {
        Backbone.View.call(this, options);
    },
    
    render : function() {
        var template = "<%= person.get('firstName') %> <%= person.get('lastName') %>";
        $(this.el).html(_.template(template, {
            person: this.model
        }));
        return this;
    }
    
});

AB.view.Rolodex = Backbone.View.extend({

   className : 'AB-rolodex',
   
   callbacks : {
       '.AB-rolodex-person.click' : 'openPerson'
   },
   
   render : function() {
       var views = AB.People.each(_.bind(function(model) {
           this.addPerson(model);
       }, this));
       return this;
   },
   
   addPerson : function(model) {
       var modelView = (new AB.view.Person({model: model})).render().el;
       console.log(['modelView', modelView]);
       $(this.el).append(modelView);
   }
   
});

$(document).ready(function() {
    var rolodex = new AB.view.Rolodex();
    $('.AB-step-0 .AB-mvc-view').html(rolodex.render().el);
});