// UUID
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

Storage.prototype.setObject = function(key, value) {
  this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
  return this.getItem(key) && JSON.parse(this.getItem(key));
}

var Store = function(name) {
  this.name = name;
};

_.extend(Store.prototype, {
  
  create: function(model) {
    this.data = localStorage.getObject(this.name);

    if (!this.data) {
      this.data = [];
    }

    if (!model.id) model.attributes.id = guid();
    
    this.data.push(model);

    localStorage.setObject(this.name, this.data);

    return {model: model, status: "success"};
  },
  
  update: function(model) {
    var newData = [];
    var succeeded = false;

    this.data = localStorage.getObject(this.name);

    if (!this.data) {
      this.data = [];
    }

    newData = _.map(this.data, function(i) {
      if (i.id == model.id) {
        succeeded = true;
        return model
      } else {
        return i
      }
    });
    
    if (!succeeded) {
      this.create(model)
    } else {
      localStorage.setObject(this.name, newData);
    }

    return {model: model, status: "success"};
  },
  
  find: function(model) {
    var record;

    this.data = localStorage.getObject(this.name);

    if (!this.data) {
      this.data = [];
    }

    _.each(this.data, function(item) {
      if (item.id == model.id) {
        record = item;
        _.breakLoop();
      }
    });

    if (typeof(record) == 'object') {
      return {model: record, status: "success"};
    } else {
      return {error: "Record Not Found.", status: "error"};
    }
  },
  
  findAll: function() {
    this.data = localStorage.getObject(this.name);
    
    if (!this.data) {
      this.data = [];
    }
    
    return {models: this.data, status: "success"};
  },
  
  destroy: function(model) {
    var newData = [];
    var recordKey;
    var succeeded = false;

    this.data = localStorage.getObject(this.name);

    if (!this.data) {
      this.data = [];
    }

    _.each(this.data, function(item, key) {
      if (item.id == model.id) {
        succeeded = true;
        recordKey = key;
        _.breakLoop();
      }
    });
    
    if (succeeded) this.data.splice(recordKey, 1);

    localStorage.setObject(this.name, this.data);

    if (succeeded) {
      return {model: model, status: "success"};
    } else {
      return {error: "Record Not Found.", status: "error"}
    }
  }
  
});

Backbone.sync = function(method, model, success, error) {
  
  var resp;
  var store = model.localStore ? model.localStore : model.collection.localStore;
  
  if (method === "read") {
    resp = model.id ? store.find(model) : store.findAll();
  } else if (method === "create") {
    resp = store.create(model);
  } else if (method === "update") {
    resp = store.update(model);
  } else if (method === "delete") {
    resp = store.destroy(model);
  }
  
  if (resp.status == "success") {
    success(resp);
  } else if (resp.status == "error" && error) {
    error(resp);
  }
};