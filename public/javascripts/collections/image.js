define([
  'backbone',
  'image_model',
  'underscore'
], function(Backbone, Image, _) {

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
  return ImageCollection;
});