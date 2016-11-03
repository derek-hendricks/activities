require.config({
	paths: {
		knockout: 'lib/knockout-latest',
		backbone: 'lib/backbone-min',
		underscore: 'lib/underscore-min',
		jquery: 'lib/jquery.min',
		activity: 'views/activity',
		activities: 'views/activities',
		activity_model: 'models/activity',
		activity_collection: 'collections/activity',
		user: 'views/user',
		user_model: 'models/user',
		user_collection: 'collections/user',
		activity_component: 'components/activity_modal',
		new_activity_component: 'components/new_activity'
	}
});

require([
	'knockout',
	'activities',
	'activity',
	'user',
	'activity_component',
	'new_activity_component',
	'router',
	'backbone'
], function (ko, ActivitiesViewModel, ActivityViewModel, UserViewModel, ActivityComponent, NewActivityComponent, Router, Backbone) {

	var ViewModel = function () {
		var self = this;
		self.user = new UserViewModel();
		self.activities = new ActivitiesViewModel();
		self.activity = new ActivityViewModel(self.activities, self.user);

		new Router({main: self, activityViewModel: self.activity, activitiesViewModel: self.activities, userViewModel: self.user});

		Backbone.history.start();
	};

	ko.components.register('activity-modal', {
    viewModel: ActivityComponent.view,
		template: ActivityComponent.template
	});

	ko.components.register('new-activity', {
    viewModel: NewActivityComponent.view,
		template: NewActivityComponent.template
	});

	ko.applyBindings(new ViewModel(), document.getElementById('activities'));
});