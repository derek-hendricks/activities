import ko from 'knockout';
import _ from 'underscore';
import utils from '../utils';

const ViewModel = function(channel) {
  var self = this, collection, model, categories;
  self.channel = channel;

  self.channel.subscribe('categories.load', function(data) {
    categories = data.response.categories;
    collection = data.collection;
    model = collection.model;
  });

  self.channel.subscribe('get.categories', function(data){
    data.callback({categories: categories});
  });

};

module.exports = ViewModel;
