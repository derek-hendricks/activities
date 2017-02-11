import ko from "knockout";
import _ from "underscore";

const ViewModel = function(channel) {
  const self = this;
  self.channel = channel;
  let collection, model, categories;

  self.channel.subscribe("Categories.load", (data) => {
    categories = data.response.categories;
    collection = data.collection;
    model = collection.model;
  });

  self.channel.subscribe("get.categories", (data) => {
    data.callback({ categories });
  });

  function getCategoryFromCollection(query) {
    if (collection) {
      return collection.find(query);
    }
  };

  function getCategoryIndex(attr, value) {
    return collection.findIndex((_category) => {
      return _category[attr] === value;
    });
  };

  self.channel.subscribe("category.create", (data) => {
    if (!data.hasOwnProperty('callback')) data.callback = function() {};
    let category = new model();
    category.save(null, {
      data: {
        update: data.category.update,
        query: data.category.query,
        upsert: data.category.upsert
      },
      processData: true,
      wait: true,
      success:  (model, res) => {
        data.callback(null, data.attr);
        category.set(data.attr);
        updateCollection(category, data.attr);
        updateCategories(data.category.attr);
      },
      error: (err) => {
        data.callback(err);
      }
    });
  });

  function updateCategories(attr) {
    const index = getCategoryIndex("_id", attr._id);
    if (index) {
      return categories.splice(index, 1, attr);
    }
    categories.push(data.attr);
  };

  function updateCollection(model, attr) {
    if (!model) {
      model = getCategoryFromCollection(query);
      model.set(attr);
    }
    collection.add(model, {
      merge: true
    });
  };

};

export default ViewModel;