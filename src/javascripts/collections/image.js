import Backbone from 'backbone';
import _ from 'underscore';
import Image from '../models/images';

var ImageCollection = Backbone.Collection.extend({
  initialize: function () {
    self = this;
  },
  model: Image,
  url: '/api/images',
  parse: function (response) {
    return _.map(response.images, function (value, key) {
      return response.images[key];
    });
  }
});
module.exports = ImageCollection;
