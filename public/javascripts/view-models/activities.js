define([
	'knockout',
	'underscore'
], function (ko, _) {

	const ViewModel = function (channel) {
		var self = this;
		self.activitiesCollection = ko.observable();
    self.activities = ko.observableArray([]);

		self.activityRows = ko.computed(function () {
			var rows = [], current = [];
			rows.push(current);
			for (var i = 0; i < self.activities().length; i += 1) {
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

		self.getActivityModel = function(query, callback) {
			if (self.activitiesCollection()) {
				var activity = self.activitiesCollection().find(query);
				return activity;
			}
		};

		self.activityAdded = function(activity) {
      self.activities.unshift(activity.attributes);
			self.activitiesCollection().add(activity);
		};

	  self.activityRemoved = function(model) {
		  var index = self.activities().indexOf(_.findWhere(self.activities(), {_id: model.id}));
      self.activities.splice(index, 1);
		  self.activitiesCollection().remove(model);
	  };

		channel.subscribe('activity_collection.updated', function(data) {
			self.activitiesCollection().add(data.model, {merge: true});
			var index = self.activities().indexOf(_.findWhere(self.activities(), {_id: data.model.id}))
			self.activities.splice(index, 1, _.clone(data.model.attributes));
		});

	  self.deleteAll = function() {
		  queue = d3.queue();
		  queue.defer(function(callback) {
				channel.publish('users.delete', {callback: function(err) {
				  if (err) return callback(err);
					callback();
				}});
		  });
			queue.defer(function(callback) {
				var activities = self.activitiesCollection().models;
				var activity_ids = activities.map(function(activity){return activity.id});
				var query = {'_id': {'$in': activity_ids}};
				activities[0].destroy({data: {db: 'activities', query: query},
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

	return ViewModel;
});