import Backbone from 'backbone';

const UserModel = Backbone.Model.extend({
  idAttribute: '_id',
  urlRoot: '/api/users'
});

export default UserModel;