import ko from 'knockout';
import _ from 'underscore';
import UserModel from '../models/user';
import UserCollection from '../collections/user';

const ViewModel = function(channel) {
	var self = this, collection;
  self.channel = channel;
	self.users = ko.observableArray([]);
	self.first_name = ko.observable();
	self.last_name = ko.observable();
	self.email = ko.observable();
	self.activities = ko.observableArray([]);
	self.organizer = ko.observable(false);
	self.participant = ko.observable(true);

  self.channel.subscribe('users.load', function(data) {
    self.users(data.response.users);
    collection = data.collection;
   });

	self.channel.subscribe('users.delete', function(data) {
		var model = data.model || collection.models[0];
		if (!model) return;
		self.removeUsers({model: model}, data.callback);
	});

	var getUser = function(query, callback) {
    if (collection) return collection.find(query);
	};

	self.channel.subscribe('fetch.user', function(data) {
		var user = getUser(data.query);
		if (user) return data.callback(null, user);
		fetchUser(data.query, data.callback);
	});

	var fetchUser = function(query, callback) {
		var model = new UserModel(query);
		model.fetch({success: function(model, response) {
			if (model.id) return callback(null, model);
		}, error: function(err) {
			callback(err);
		}});
	};

	let updateUser = (query, update, upsert, callback) => {
		var model = new UserModel();
    model.save(null, {
			data: {update: update, query: query, upsert: upsert},
			processData: true,
			wait: true,
			success: function(model, response) {
				return callback(null);
			}, error: function(err) {
				return callback(err);
			}
		});
	};

	self.channel.subscribe('create.update.user', function(data) {
    updateUser(data.query, data.update, data.upsert, function(err, result) {
			var activities, user;
			if (err) {
        return data.callback(err);
      }
			user = getUser(data.query);
			if (user) {
				activities = user.get('activities');
				activities.push(data.activity)
				user.set({activities: activities});
				collection.add(user, {merge: true});
			}
			data.callback(err, result);
		});
	});

  self.channel.subscribe('remove.user.activity', function(data) {
		var activities, index, update, model;
		model = data.user_model || getUser({_id: data._id});
		activities = model.get('activities');
		index = activities.indexOf(data.activity_id);
		activities.splice(index, 1);
		model.set({activities: activities});
		update = {'$pull': {'activities': data.activity_id}};
		self.updateUser({_id: model.id}, update, null, function(err) {
			if (data.callback) data.callback(err);
		});
	});

	self.removeUsers = function(data, callback) {
		var query = {};
		if (data.users) query = {'_id': {'$in': data.users.map(function(user){return user.id})}};
		data.model.destroy({data: {col: 'users', query: query},
			processData: true,
			success: function(models, response) {
				collection.reset();
				self.users([]);
				callback()
			}, error: function(err) {
				return callback(err);
			}
		});
	};

};

module.exports = ViewModel;
