import Backbone from 'backbone';
import ko from 'knockout';
import Postal from 'postal';

import Router from './router';

import ActivitiesViewModel from './view-models/activities';
import ActivityViewModel from './view-models/activity';
import UserViewModel from './view-models/user';
import ImageViewModel from './view-models/images';

import ActivityComponent from './components/activity_modal';
import NewActivityComponent from './components/new_activity';
import ImageComponent from './components/images';
import ActivitySearchComponent from './components/activity_search';


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

var loadComponent = function(component) {
  ko.components.register(component.name, {
    viewModel: component.viewModel,
    template: component.template
  });
}

var _components = [
  ActivityComponent,
  NewActivityComponent,
  ImageComponent,
  ActivitySearchComponent
];

for (var i = 0; i < _components.length; i++) {
  loadComponent(_components[i]);
}

ko.applyBindings(new ViewModel(), document.getElementById('activities'));