/**
 * A simple module to override `Backbone.sync` localStorage based persistence
 * ability to use different kinds of models with same keys (ie : "human|001", "doc|001", ...)
 * User: k33g
 * Date: 24/08/11
 * Time: 09:12
 */

/* Use :

myModel.save()              : save model to local storage
myModel.fetch()             : get model from local storage
myModel.destroy()           : delete model from local storage

myModelsCollection.fetch()  : load all models from local storage

Model and Collection must have a property `storeName`
then `key storage` of a model is calculated like that : `storeName` + "|" + `model.id`


Sample :

(function($) {

    window.Doc = Backbone.Model.extend({
        storeName : "docsDB"
    });


    window.Docs = Backbone.Collection.extend({
        model : Doc,
        storeName : "docsDB"
    });

    window.Human =  Backbone.Model.extend({
        storeName : "humansDB"
    });

    window.Humans =  Backbone.Collection.extend({
        model : Human,
        storeName : "humansDB"
    });

    var doc1, doc2, doc3, doc4, h1, h2, h3;

    doc1 = new Doc({id:'001', title:'TITLE 1', text:'TEXT1'});
    doc2 = new Doc({id:'002', title:'TITLE 2', text:'TEXT2'});
    doc3 = new Doc({id:'003', title:'TITLE 3', text:'TEXT3'});
    doc4 = new Doc({id:'004', title:'TITLE 4', text:'TEXT4'});

    h1 = new Human({id:'001', name:'Human 1'});
    h2 = new Human({id:'002', name:'Human 2'});
    h3 = new Human({id:'003', name:'Human 3'});

    doc1.save();
    doc2.save();
    doc3.save();
    doc4.save();

    h1.save();
    h2.save();
    h3.save();

    var docs = new Docs();
    var humans = new Humans();

    docs.fetch();
    humans.fetch();

    console.log(docs);
    console.log(humans);

})(Zepto);


 */

Backbone.sync = function(method, model, options) {

    var resp;
    var store = window.localStorage;

    function GUID() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };

    function save (obj) {
        var id = obj.storeName + '|' + (obj.id || GUID());
        store.setItem(id, JSON.stringify(obj));
        obj.id = id.split('|')[1];
        return obj;
    };

    function get (obj) {
        return JSON.parse(store.getItem(obj.storeName + '|' + obj.id));
    };

    function remove (obj) {
        var key = obj.storeName + '|' + obj.id;
        store.removeItem(key);
        return obj;
    };

    function all (collection) {
        var i, l = store.length, id, key, baseName, obj;
        for (i = 0; i < l; i += 1) {
            id = store.key(i);
            baseName = id.split('|')[0];
            key = id.split('|').slice(1).join("|");
            if (baseName === collection.storeName) {
                obj = JSON.parse(store.getItem(id));
                collection.add(obj);
            }
        }
    };

    switch (method) {
        case "read":    resp = model.id ? get(model) : all(model); break;
        case "create":  resp = save(model);                            break;
        case "update":  resp = save(model);                            break;
        case "delete":  resp = remove(model);                           break;
    }

    if (resp) {
        options.success(resp);
    } else {
        options.error("Record not found");
    }
};