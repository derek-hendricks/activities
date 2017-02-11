import Backbone from 'backbone';
import model from '../models/activity';

const Activities = Backbone.Collection.extend({
  initialize: function () {
    self = this;
  },
  model: model,
  url: '/api/activities',
  parse: function (response) {
    return _.map(response.activities, function (value, key) {
      return response.activities[key];
    });
  }
});

export default Activities;



