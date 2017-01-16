import Backbone from 'backbone';
import Activity from '../models/activity';

const ActivityCollection = Backbone.Collection.extend({
  initialize: function () {
    self = this;
  },
  model: Activity,
  url: '/api/activities',
  parse: function (response) {
    return _.map(response.activities, function (value, key) {
      return response.activities[key];
    });
  }
});

module.exports = ActivityCollection;


