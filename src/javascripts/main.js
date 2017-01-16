import Backbone from 'backbone';
import ko from 'knockout';
import Postal from 'postal';
import './utils/knockout.dragdrop';

import Router from './router';

import ActivitiesViewModel from './view-models/activities';
import ActivityViewModel from './view-models/activity';
import UserViewModel from './view-models/user';
import ImageViewModel from './view-models/images';
import CategoriesViewModel from './view-models/categories';

import ActivityComponent from './components/activity_modal';
import NewActivityComponent from './components/new_activity';
import ImageComponent from './components/images';
import ActivitySearchComponent from './components/activity_search';
import FeaturedActivityComponent from './components/featured_activity';
import FooterComponent from './components/footer';
import ActivitiesMngComponent from './components/activities_manage';
import CategoriesComponent from './components/categories';


var ViewModel = function () {
	var self = this, registerComponent;
	self.channel = Postal.channel();
	self.user = new UserViewModel(self.channel);
	self.activities = new ActivitiesViewModel(self.channel);
	self.activity = new ActivityViewModel(self.activities, self.channel);
  self.categories = new CategoriesViewModel(self.channel);
  self.images = new ImageViewModel(self.channel);

	new Router({channel: self.channel});

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
  FeaturedActivityComponent,
  FooterComponent,
  ActivitiesMngComponent,
  CategoriesComponent
];

for (var i = 0, l = _components.length; i < l; i++)  {
  registerComponent(_components[i]);
}

// ko.options.deferUpdates = true;

ko.applyBindings(new ViewModel(), document.getElementById('activities'));