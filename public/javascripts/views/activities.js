define([
	'knockout',
	'activity_collection'
], function (ko) {

	const ViewModel = function () {
		var self = this;
		self.activitiesCollection = ko.observable();
    self.activities = ko.observableArray([]);

		self.activityRows = ko.computed(function () {
			var rows = [], current = [];
			rows.push(current);
			for (var i = 0; i < self.activities().length; i += 1) {
				current.push(self.activities()[i]);
					if (((i + 1) % 3) === 0) {
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

	};

	return ViewModel;
});