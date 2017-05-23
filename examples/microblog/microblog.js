
(function() {

let postId = 0;

const microblog = {};

/*****************
    Post Model
 *****************/
microblog.PostModel = Backbone.Model.extend({

	defaults: {
		title: '',
		content: '',
		posted_by: 'Anonymus',
		date: new Date().toDateString(),
		shouldShow: true
	},

	initialize() {
		this.set('id', postId++);
	},

	setVisibility(shouldShow) {
		this.set({ shouldShow });
	}

});

/******************
  Posts Collection
 ******************/
microblog.PostCollection = Backbone.Collection.extend({

	model: microblog.PostModel,

	filterPosts(searchString) {
		this.models.forEach(post => {
			let shouldShow = post.get('title').indexOf(searchString) !== -1;
			post.setVisibility(shouldShow);
		});
	},

	postsCount() {
		return this.where({ shouldShow : true }).length;
	}

});

/*****************
    Post View
 *****************/
microblog.PostView = Backbone.View.extend({

	tagName: 'div',

	template: _.template($('#post-template').html()),

	render() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}

});

/*****************
    Posts View
 *****************/
microblog.PostsView = Backbone.View.extend({

 	el: '#posts-list',

 	initialize() {
 		this.render();
 	},

 	render() {
 		this.$el.empty();
 		this.collection.models.forEach(model => {
 			let postView = new microblog.PostView({ model });
 			this.$el.append(postView.render().el);
 		});
 	}

 });

/*************
   App View
 *************/
microblog.AppView = Backbone.View.extend({

	el: '#container',

	initialize() {
		this.postsCount = this.$('#posts-count');
		this.title = this.$('#title');
		this.posted_by = this.$('#name');
		this.content = this.$('#content');

		this.postsList = new microblog.PostCollection(); // initialize posts collection 
		this.postsList.bind('add', this.render, this); // render on add to collection
	},

	events: {
		'click #post-button': 'addPost',
		'click .remove-post': 'removePost',
		'keyup #filter-posts': 'filterPosts'
	},

	addPost(e) {
		e.preventDefault();
		let title = this.title.val();
		let posted_by = this.posted_by.val();
		let content = this.content.val();
		if(!title || !posted_by || !content)
			return;
		let newPost = new microblog.PostModel({ title, posted_by, content });
		this.postsList.add(newPost);
		this.cleanInputFields();
	},

	removePost(e) {
		let id = e.target.parentNode.parentNode.getAttribute('data-id');
		this.postsList.remove(id);
		this.render();
	},

	filterPosts(e) {
		let value = e.target.value;
		this.postsList.filterPosts(value);
		this.render();
	},

	cleanInputFields() {
		this.title.val('');
		this.posted_by.val('');
		this.content.val('');
	},

	render() {
		this.postsCount.text(this.postsList.postsCount());
		new microblog.PostsView({ collection : this.postsList });
	}

});

new microblog.AppView(); // initialize app view

})();