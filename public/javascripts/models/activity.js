define([
	'backbone'
], function (Backbone) {

  const ActivityModel = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: '/api/activities',
  });

	return ActivityModel;
});