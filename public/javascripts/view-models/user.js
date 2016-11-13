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

    channel.subscribe('users.delete', function(data) {
      var users = data.models || self.userCollection().models;
			self.removeUsers(users, data.callback);
    });

		var getUser = function(query, callback) {
			return self.userCollection().find(query);
		};

		channel.subscribe('fetch.user', function(data) {
			var user = getUser(data.query);
			if (user) return data.callback(null, user);
      fetchUser(data.query, data.callback);
    });

    var fetchUser = function(query, callback) {
      var model = new UserModel(query);
			model.fetch({success: function(model, response) {
				if (model.id) return callback(null, model);
				return callback(model);
			}, error: function(err) {
				callback(err);
			}});
		};

		self.updateUser = function(update_query, model, callback) {
			model.save(null, {
				data: {query: update_query, col: 'users'}, processData: true,
				wait: true,
				success: function(model, response) {
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
			self.updateUser(query, model, function(err, result) {
				if (err) return callback(err);
				callback()
			});
		};

		self.addUserActivities = function(model, activity_data, callback) {
			var activities;
			if (activities = model.get('activities')) {
        if (activities.constructor == Array) {
					activities.push(activity_data._id)
				} else {
					activities = [activity_data._id]
				}
			} else {
				activities = [activity_data._id]
			}
			model.set({activities: activities});
			var update_query = {'$push': {'activities': activity_data._id}}
			self.updateUser(update_query, model, function(response) {
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