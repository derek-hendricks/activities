define([
	'knockout',
	'underscore',
	'user_model',
	'user_collection'
], function (ko, _, UserModel, UserCollection) {

	var ViewModel = function(channel) {
		var self = this;
    self.userCollection = ko.observable();
		self.users = ko.observableArray([]);
    self.first_name = ko.observable();
    self.last_name = ko.observable();
    self.email = ko.observable();
    self.activities = ko.observableArray([]);
    self.organizer = ko.observable(false);
    self.participant = ko.observable(true);

    var subscription = channel.subscribe('users.delete', function(data) {
      var users = data.models || self.userCollection().models;
			self.removeUsers(users, data.callback);
    });

		self.getUser = function(query, callback) {
			var user = self.userCollection().find(query);
			return user;
		};

		self.updateUser = function(update_query, model, attributes, callback) {
			model.save(null, {
				data: {query: update_query, col: 'users'}, processData: true,
				success: function(model, response) {
					model.set(attributes);
				  self.userCollection().add(model, {merge: true});
					var index = self.users().indexOf(_.findWhere(self.users(), {_id: model.id}))
					self.users.splice(index, 1, _.clone(model.attributes));
					return callback(null);
				}, error: function(response) {
				  return callback(response.responseText);
				}
			});
		};

		self.newUser = function(user, callback) {
			model = new UserModel();
			model.save(user, {
				wait: true,
				success: function(model, response) {
					self.users().push(response);
					self.userCollection().add(model);
					callback(null, model, response);
				},
				error: function(err) {
					callback(err);
				}
			});
		};

		self.removeUserActivity = function(model, activity_id, callback) {
			var activities = model.get('activities').slice();
			var index = activities.indexOf(activity_id);
			activities.splice(index, 1);
			var query = activities.length ?
			  {$set: {activities: activities}} :
				{$unset: {activities: ''}};
			self.updateUser(query, model, {activities: activities}, function(err, result) {
				if (err) return callback(err);
				callback()
			});
		};

		self.addUserActivities = function(model, activity_data, callback) {
			var activities = model.get('activities').slice() || [];
			activities.push(activity_data._id);
			var update_query = {$set: {activities: activities}};
			self.updateUser(update_query, model, {activities: activities}, function(response) {
				callback(response);
			});
		};

		self.removeUsers = function(users, callback) {
			var user_ids = users.map(function(user){return user.id});
			var query = {'_id': {'$in': user_ids}};
			users[0].destroy({data: {col: 'users', query: query},
			  processData: true,
			  success: function(models, response) {
					self.userCollection().reset();
					self.users([]);
					callback()
        }, error: function(err) {
				  return callback(err);
			  }
		  });
		};

	};
	return ViewModel;
});