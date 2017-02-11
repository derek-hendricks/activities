import Backbone from 'backbone';
import User from '../models/user';

const UserCollection = Backbone.Collection.extend({
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

export default UserCollection;
