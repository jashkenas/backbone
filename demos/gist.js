// Backbone Demo: Gist Browser
// ---------------------------

var GistApp = Backbone.View.extend({

  events : {
    'submit #picker': 'loadAccount'
  },

  initialize : function() {
    this.handleEvents();
  },

  loadAccount : function() {
    var name          = this.$("#github_account").val();
    this.account      = new GithubAccount({username : name});
    this.accountView  = new AccountView({model: this.account});
    this.$('#account_container').html(this.accountView.el);
    return false;
  }

});

var GithubAccount = Backbone.Model.extend({

  initialize : function() {
    $.getJSON(this.url(), {}, _.bind(function(resp) {
      this.set(resp.user);
    }, this));
  },

  url : function() {
    return 'http://gist.github.com/api/v1/json/' + this.get('username');
  }

});

var AccountView = Backbone.View.extend({

  template : $('#accountTemplate'),

  initialize : function() {
    _.bindAll(this, 'render');
    this.model.bind("change", this.render);
  },

  render : function() {
    console.log(this.model);
    var ui = $('#accountTemplate').tmpl({account : this.model});
    $(this.el).html(ui);
  }

});

var GistList = Backbone.View.extend({

  id : 'gists'

});

$(function() {
  new GistApp({el: document.body});
});