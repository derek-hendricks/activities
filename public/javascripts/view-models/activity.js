define([
	'knockout',
	'underscore',
	'user_model',
	'user_collection'
], function (ko, _, UserModel, UserCollection) {

	const ViewModel = function (activitiesViewModel, userViewModel, channel) {
		var self = this;
		self.model = ko.observable();
		self.user_model = ko.observable();
		self.userActivities = ko.observableArray([]);
		self.userViewModel = userViewModel;
		self.activitiesViewModel = activitiesViewModel;
		self.channel = channel;

		var show = channel.subscribe('activity.show', function(data) {
			var getUser, user, model;
			model = self.activitiesViewModel.getActivityModel({_id: data.id});
			if (model) {
				self.model(model);
				user = self.userViewModel.getUser({_id: model.get('organizer_id')});
				self.user_model(user);
				var _user_activities = getUserActivities();
				self.userActivities(_user_activities);
			} else {
				data.getActivityModel(function(err, _model) {
					if (err) return callback(err);
					self.model(_model);
					getUser(_model.get('organizer_id'));
				});
				getUser = function(user_id) {
          data.getUserModel(user_id, function(err, _user_model) {
					  if (err) return callback(err);
					  self.user_model(_user_model);
						self.userActivities(getUserActivities());
				  });
				};
			}
    });

		var getUserActivities = function() {
			var related_activities = [], user_activity, current_id;
			var activity_ids = self.user_model().get('activities').slice();
			var index = activity_ids.indexOf(self.model().id);
			activity_ids.splice(index, 1);
			if (activity_ids.length >= 1) {
				for (var i = 0; i < activity_ids.length; i++) {
					user_activity = self.activitiesViewModel.getActivityModel({_id: activity_ids[i]})
					related_activities.push(user_activity);
				}
			}
			return related_activities;
		};

		channel.subscribe('activity.update', function(data) {
      data.model.save(null, {
				data: {query: data.query, col: 'activities'},
			  processData: true,
				success: function(model, response) {
					model.set(data.attributes);
					self.channel.publish('activity_collection.updated', {model: model});
					data.callback(null, model);
				}, error: function(err) {
					data.callback(err);
				}
			});
		});

	  channel.subscribe('activity.remove', function(data) {
		  var id = self.model().id;
			self.activitiesViewModel.activityRemoved(self.model());
			self.model().destroy({data: {col: 'activities'},
			  processData: true,
			  success: function(model, response) {
					if (!data.user_model) return data.callback();
					return self.userViewModel.removeUserActivity(data.user_model, id, data.callback);
        }, error: function(err) {
				  return data.callback(err);
			  }
		  });
	  });
	};

	return ViewModel;
});