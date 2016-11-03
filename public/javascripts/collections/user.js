define([
  'backbone',
  'user_model',
  'underscore'
], function(Backbone, User, _) {

  var UserCollection = Backbone.Collection.extend({
    initialize: function () {
      self = this;
    },
    model: User,
    url: '/api/users',
    parse: function (response) {
      return _.map(response.users, function (value, key) {
        return response.users[key];
      });
    }
  });
  return UserCollection;
});