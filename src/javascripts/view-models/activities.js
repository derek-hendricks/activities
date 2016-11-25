import ko from 'knockout';
import _ from 'underscore';

const ViewModel = function (channel) {
	var self = this;
	self.activitiesCollection = ko.observable();
	self.activities = ko.observableArray([]);
	self.channel = channel;

	self.activityRows = ko.computed(function () {
		var rows = [], current = [];
		rows.push(current);
		for (var i = 0; i < self.activities().length; i++) {
			current.push(self.activities()[i]);
			if (((i + 1) % 4) === 0) {
			  current = [];
			  rows.push(current);
			}
		}
		return rows;
	}, self);

	self.getActivity = function(id) {
		return self.activities().find(function(activity) {
		  return activity._id === id;
		});
	};

	self.getActivityModel = function(query) {
		if (self.activitiesCollection()) {
		  return self.activitiesCollection().find(query);
		}
	};

	self.activityRemoved = function(model) {
		var index = self.activities().indexOf(_.findWhere(self.activities(), {_id: model.id}));
		self.activities.splice(index, 1);
		self.activitiesCollection().remove(model);
	};

	self.channel.subscribe('activity_collection.updated', function(data) {
		self.activitiesCollection().add(data.model, {merge: true});
		var index = self.activities().indexOf(_.findWhere(self.activities(), {_id: data.model.id}))
		self.activities.splice(index, 1, _.clone(data.model.attributes));
	});

	self.channel.subscribe('activity.added', function(data) {
		self.activities.unshift(data.model.attributes);
		self.activitiesCollection().add(data.model);
	});

	self.deleteAll = function() {
		var queue = d3.queue();
		queue.defer(function(callback) {
			self.channel.publish('users.delete', {callback: function(err) {
				callback(err);
			}});
		});
		queue.defer(function(callback) {
			var activities = self.activitiesCollection().models;
			var activity_ids = activities.map(function(activity){return activity.id});
			var query = {'_id': {'$in': activity_ids}};
			activities[0].destroy({data: {col: 'activities', query: query},
				processData: true,
				success: function(models, response) {
					self.activities([]);
					self.activitiesCollection().reset();
					callback()
				}, error: function(err) {
				  return callback(err);
				}
			});
		});
		queue.await(function(err) {
		  if (err) return console.log(err);
		  console.log('all users and activities deleted');
		});
	};

};

module.exports = ViewModel;
