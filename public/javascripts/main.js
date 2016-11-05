require.config({
	paths: {
		knockout: 'lib/knockout-latest',
		backbone: 'lib/backbone-min',
		underscore: 'lib/underscore-min',
		lodash: 'lib/lodash',
		postal: 'lib/postal.min',
		jquery: 'lib/jquery.min',
		utils: 'utils/index',
		activity: 'view-models/activity',
		activities: 'view-models/activities',
		activity_model: 'models/activity',
		activity_collection: 'collections/activity',
		user: 'view-models/user',
		user_model: 'models/user',
		user_collection: 'collections/user',
		activity_component: 'components/activity_modal',
		new_activity_component: 'components/new_activity',
		user_component: 'components/user_modal'
	}
});

require([
	'knockout',
	'backbone',
	'postal',
	'activities',
	'activity',
	'user',
	'activity_component',
	'new_activity_component',
	'user_component',
	'router'
], function (ko, Backbone, Postal, ActivitiesViewModel, ActivityViewModel, UserViewModel, ActivityComponent, NewActivityComponent, UserComponent, Router) {

	var ViewModel = function () {
		var self = this;
		var channel = Postal.channel();
		self.user = new UserViewModel(channel);
		self.activities = new ActivitiesViewModel(channel);
		self.activity = new ActivityViewModel(self.activities, self.user, channel);

		new Router({channel: channel, activityViewModel: self.activity, activitiesViewModel: self.activities, userViewModel: self.user});

		Backbone.history.start();
	};

	ko.components.register('activity-modal', {
    viewModel: ActivityComponent.vm,
		template: ActivityComponent.template
	});

	ko.components.register('new-activity', {
    viewModel: NewActivityComponent.vm,
		template: NewActivityComponent.template
	});

	ko.components.register('user-modal', {
		ViewModel: UserComponent.vm,
		template: UserComponent.template
	});

	ko.applyBindings(new ViewModel(), document.getElementById('activities'));
});