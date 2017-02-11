import Backbone from 'backbone';
import Category from '../models/category';

const CategoryCollection = Backbone.Collection.extend({
  initialize: function () {
    self = this;
  },
  model: Category,
  url: '/api/categories',
  parse: function (response) {
    return _.map(response.categories, function (value, key) {
      return response.categories[key];
    });
  }
});

export default CategoryCollection;


