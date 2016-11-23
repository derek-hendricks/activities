import Backbone from 'backbone';
import _ from 'underscore';
import User from '../models/user';

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
module.exports = UserCollection;
