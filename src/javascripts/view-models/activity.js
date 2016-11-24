import ko from 'knockout';
import _ from 'underscore';
import ActivityModel from '../models/activity';

var ViewModel = function (activitiesViewModel, channel) {
	var self = this;
	self.model = ko.observable();
	self.user_model = ko.observable();
	self.userActivities = ko.observableArray([]);
	self.activitiesViewModel = activitiesViewModel;
	self.channel = channel;

	var show = self.channel.subscribe('activity.show', function(data) {
		var model = self.activitiesViewModel.getActivityModel({_id: data.id});
		if (model) {
			self.model(model);
			getUser(model.get('organizer_id'));
		} else {
			data.getActivityModel(function(err, _model) {
				if (err) return data.callback(err);
				self.model(_model);
				getUser(_model.get('organizer_id'));
			});
		}
	});

	var getUser = function(id) {
		self.channel.publish('fetch.user', {query: {_id: id}, callback: function(err, _user_model) {
			self.user_model(_user_model);
			self.userActivities(getUserActivities());
		}});
	};

	var getUserActivities = function() {
		var related_activities = [], user_activity, current, activity_ids;
		activity_ids = self.user_model().get('activities').slice();
    current = activity_ids.indexOf(self.model().id);
		activity_ids.unshift((activity_ids).splice(current, 1)[0]);
		for (var i = 0; i < activity_ids.length; i++) {
			user_activity = self.activitiesViewModel.getActivityModel({_id: activity_ids[i]})
			if (user_activity) related_activities.push(user_activity);
		}
	  return related_activities;
  };

  self.channel.subscribe('activity.create', function(data) {
		var activityModel = new ActivityModel();
		activityModel.save(data.activity, { wait: true, success: function(model, response) {
			data.callback(null, model);
		}, error: function(model, response) {
			data.callback(response);
		}});
	});

	self.channel.subscribe('activity.update', function(data) {
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

	self.channel.subscribe('activity.remove', function(data) {
		self.activitiesViewModel.activityRemoved(data.model);
		data.model.destroy({data: {col: 'activities'},
			processData: true,
			success: function(model, response) {
				if (!data.user_model) return data.callback();
				self.channel.publish('remove.user.activity', {
					user_model: data.user_model, activity_id: data.model.id, callback: data.callback
				});
			}, error: function(err) {
			  data.callback(err);
			}
		});
	});
};

module.exports = ViewModel;
