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
import FeaturedActivityComponent from './components/featured_activity';


var ViewModel = function () {
	var self = this;
	self.channel = Postal.channel();
	self.user = new UserViewModel(self.channel);
	self.activities = new ActivitiesViewModel(self.channel);
	self.images = new ImageViewModel(self.channel);
	self.activity = new ActivityViewModel(self.activities, self.channel);

	new Router({channel: self.channel, activityViewModel: self.activity, activitiesViewModel: self.activities, userViewModel: self.user});

	Backbone.history.start();
};

var registerComponent = function(component) {
  ko.components.register(component.name, {
    viewModel: component.viewModel,
    template: component.template
  });
}

var _components = [
  ActivityComponent,
  NewActivityComponent,
  ImageComponent,
  ActivitySearchComponent,
  FeaturedActivityComponent
];

for (var i = 0; i < _components.length; i++) {
  registerComponent(_components[i]);
}

ko.applyBindings(new ViewModel(), document.getElementById('activities'));