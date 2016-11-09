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
		image_model: 'models/images',
		activity_collection: 'collections/activity',
		image_collection: 'collections/image',
		user: 'view-models/user',
		images: 'view-models/images',
		user_model: 'models/user',
		user_collection: 'collections/user',
		activity_component: 'components/activity_modal',
		new_activity_component: 'components/new_activity'
	}
});

require([
	'knockout',
	'backbone',
	'postal',
	'activities',
	'activity',
	'user',
	'images',
	'activity_component',
	'new_activity_component',
	'router'
], function (ko, Backbone, Postal, ActivitiesViewModel, ActivityViewModel, UserViewModel, ImageViewModel, ActivityComponent, NewActivityComponent, Router) {

	var ViewModel = function () {
		var self = this;
		var channel = Postal.channel();
		self.user = new UserViewModel(channel);
		self.activities = new ActivitiesViewModel(channel);
		self.images = new ImageViewModel(channel);
		self.activity = new ActivityViewModel(self.activities, self.user, channel);

		new Router({channel: channel, activityViewModel: self.activity, activitiesViewModel: self.activities, userViewModel: self.user, imageViewModel: self.images});

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


	ko.applyBindings(new ViewModel(), document.getElementById('activities'));
});