import Backbone from 'backbone';
import ko from 'knockout';
import Postal from 'postal';
import ActivitiesViewModel from './view-models/activities';
import ActivityViewModel from './view-models/activity';
import UserViewModel from './view-models/user';
import ImageViewModel from './view-models/images';
import ActivityComponent from './components/activity_modal';
import NewActivityComponent from './components/new_activity';
import ImageComponent from './components/images';
import ActivitySearchComponent from './components/activity_search';
import Router from './router';

var ViewModel = function () {
	var self = this;
	var channel = Postal.channel();
	self.user = new UserViewModel(channel);
	self.activities = new ActivitiesViewModel(channel);
	self.images = new ImageViewModel(channel);
	self.activity = new ActivityViewModel(self.activities, channel);

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

ko.components.register('images', {
	viewModel: ImageComponent.vm,
	template: ImageComponent.template
});

ko.components.register('activity-search', {
	viewModel: ActivitySearchComponent.vm,
	template: ActivitySearchComponent.template
});

ko.applyBindings(new ViewModel(), document.getElementById('activities'));