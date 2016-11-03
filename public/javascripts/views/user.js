define([
	'knockout',
	'underscore',
	'user_model',
	'user_collection'
], function (ko, _, UserModel, UserCollection) {

	var ViewModel = function () {
		var self = this;
    self.userCollection = ko.observable();
		self.users = ko.observableArray([]);
    self.first_name = ko.observable();
    self.last_name = ko.observable();
    self.email = ko.observable();
    self.activities = ko.observableArray([]);
    self.organizer = ko.observable(false);
    self.participant = ko.observable(true);

		self.getUser = function(query, callback) {
			var user = self.userCollection().find(query);
			return user;
		};

		self.updateUser = function(update_query, model, callback) {
			model.save(null, {
				data: {query: update_query, db: 'users'}, processData: true,
				success: function(model, response) {
					self.userCollection().add(model, {merge: true});
					var index = self.users().indexOf(_.findWhere(self.users(), {_id: model.id}))
					self.users()[index].activities = model.get('activities');
					return callback(null);
				}, error: function(response) {
				  return callback(response.responseText);
				}
			});
		};

		self.newUser = function(user, callback) {
			self.userCollection().create(user, {
			  success: function(model, response) {
					self.users().push(model.attributes);
					self.userCollection().add(model);
					callback(null, model, response);
				},
				error: function(err) {
					callback(err);
				}
			});
		};

		self.removeUserActivity = function(model, activity_id, callback) {
			var activities = model.get('activities');
			var index = activities.indexOf(activity_id);
			activities.splice(index, 1);
			model.set('activities', activities);
			var query = activities.length ?
			  {$set: {activities: activities}} :
				{$unset: {activities: ''}}

			self.updateUser(query, model, function(err, result) {
				if (err) return callback(err);
				callback()
			});
		};

		self.addUserActivities = function(model, activity_data, callback) {
			var activities = model.get('activities') || [];
			// activities = activities.filter(function(activity){return activity !== null});

			activities.push(activity_data._id);
			model.set('activities', activities);
			console.log('activities', activities);

			var update_query = {$set: {activities: activities}}
			self.updateUser(update_query, model, function(response) {
				callback(response);
			});
		}
	};

	return ViewModel;
});