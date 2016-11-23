import Backbone from 'backbone';

const ActivityModel = Backbone.Model.extend({
  idAttribute: '_id',
  urlRoot: '/api/activities',
});

module.exports = ActivityModel;
