define([
  'backbone',
  'activity_model'
], function(Backbone, Activity) {

  var ActivityCollection = Backbone.Collection.extend({
    initialize: function () {
      self = this;
      // self.bind('add', self.onModelAdded, self);
      self.bind('remove', self.onModelRemoved, self);
    },

    model: Activity,

    url: '/api/activities',

    parse: function (response) {
      return _.map(response.activities, function (value, key) {
        return response.activities[key];
      });
    },

    onModelAdded: function(model, collection, options) {
      console.log("ActivityCollection add: model", model);
    },

    onModelRemoved: function (model, collection, options) {
      console.log("ActivityCollection remove: model", model);
    }
  });

  return ActivityCollection;
});

