import Backbone from 'backbone';
import _ from 'underscore';

const ImageModel = Backbone.Model.extend({
  idAttribute: 'text',
  urlRoot: '/api/images',
  url: function() {
    var root_url = '/api/images';
    if (this.isNew()) return root_url;
    return root_url + '/' + encodeURIComponent(this.get('text'));
  }
});

export default ImageModel;
