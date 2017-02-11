import Backbone from 'backbone';

const CategoryModel = Backbone.Model.extend({
  idAttribute: '_id',
  urlRoot: '/api/categories',
});

export default CategoryModel;
