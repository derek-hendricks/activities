define([
	'backbone'
], function (Backbone) {

 const UserModel = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: '/api/users'
  });

	return UserModel;
});
