import Backbone from 'backbone';
import Image from '../models/images';

const ImageCollection = Backbone.Collection.extend({
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

export default ImageCollection;
