define([
	'backbone',
  'underscore'
], function (Backbone, _) {

  const ImageModel = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: '/api/images',
    url: function() {
      var root_url = '/api/images';
      if (this.isNew()) return root_url;
      return root_url + '/' + encodeURIComponent(this.id) + '/' + encodeURIComponent(this.get('text'));
    }
  });

	return ImageModel;
});