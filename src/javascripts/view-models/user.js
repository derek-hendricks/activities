import ko from 'knockout';
import _ from 'underscore';
import UserModel from '../models/user';
import UserCollection from '../collections/user';

const ViewModel = function(channel) {
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
		var model = data.model || self.userCollection().models[0];
		self.removeUsers({model: model}, data.callback);
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

	self.updateUser = function(query, update, upsert, callback) {
		var model = new UserModel();
		model.save(null, {
			data: {update: update, query: query, upsert: upsert},
			processData: true,
			wait: true,
			success: function(model, response) {
				return callback(null);
			}, error: function(response) {
				return callback(response);
			}
		});
	};

	channel.subscribe('create.update.user', function(data) {
    self.updateUser(data.query, data.update, data.upsert, function(err, result) {
			var activities, user;
			if (err) return data.callback(err);
			user = getUser(data.query);
			if (user) {
				activities = user.get('activities');
				activities.push(data.activity)
				user.set({activities: activities});
				self.userCollection().add(user, {merge: true});
			}
			data.callback(err, result);
		});
	});

  channel.subscribe('remove.user.activity', function(data) {
		var activities = data.user_model.get('activities');
		var index = activities.indexOf(data.activity_id);
		activities.splice(index, 1);
		data.user_model.set({activities: activities});
		var update = {'$pull': {'activities': data.activity_id}};
		self.updateUser({_id: data.user_model.id}, update, null, function(err, result) {
			if (err) return data.callback(err);
			data.callback()
		});
	});

	self.removeUsers = function(data, callback) {
		var query = {};
		if (data.users) query = {'_id': {'$in': data.users.map(function(user){return user.id})}};
		data.model.destroy({data: {col: 'users', query: query},
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

module.exports = ViewModel;
