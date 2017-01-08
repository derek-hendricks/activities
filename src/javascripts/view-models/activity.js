import ko from 'knockout';
import _ from 'underscore';
import ActivityModel from '../models/activity';

var ViewModel = function (activitiesViewModel, channel) {
	var self = this;
	self.model = ko.observable();
	self.user_model = ko.observable();
	self.user_activities = ko.observableArray([]);
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
			self.user_activities(getUserActivities());
		}});
	};

	var getUserActivities = function() {
		var related_activities = [], user_activity, current, activity_ids;
		activity_ids = self.user_model().get('activities').slice();
    current = activity_ids.indexOf(self.model().id);
		activity_ids.unshift((activity_ids).splice(current, 1)[0]);
		for (var i = 0, l = activity_ids.length; i < l; i++)  {
			user_activity = self.activitiesViewModel.getActivityModel({_id: activity_ids[i]})
			if (user_activity) related_activities.push(user_activity);
		}
	  return related_activities;
  };

  self.channel.subscribe('activity.create', function(data) {
		var activityModel = new ActivityModel();
		activityModel.save(data.activity, {
			wait: true,
			success: function(model, response) {
			data.callback(null, model);
		}, error: function(model, response) {
			data.callback(response);
		}});
	});

	self.channel.subscribe('activity.update', function(data) {
		var model = data.model || self.activitiesViewModel.getActivityModel({_id: data._id});
		if (!model) return data.callback('Could not find activity: ' + data._id);
		model.save(null, {
			data: {query: data.query, col: 'activities'},
			processData: true,
			success: function(_model, response) {
				model.set(data.attributes);
				data.callback(null, model);
			}, error: function(err) {
				data.callback(err);
			}
		});
	});

	self.channel.subscribe('activity.remove', function(data) {
		var model = data.model || self.activitiesViewModel.getActivityModel({_id: data._id});
		self.activitiesViewModel.activityRemoved(model, model.id);
		model.destroy({data: {col: 'activities'},
			processData: true,
			success: function(model, response) {
				self.channel.publish('remove.user.activity', {
					_id: data.organizer_id, user_model: data.user_model || null, activity_id: model.id, callback: data.callback
				});
			}, error: function(err) {
			  data.callback(err);
			}
		});
	});
};

module.exports = ViewModel;
