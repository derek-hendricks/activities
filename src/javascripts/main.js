import Backbone from "backbone";
import ko from "knockout";
import Postal from "postal";
import "./utils/knockout.dragdrop";

import Router from "./router";

import ActivitiesViewModel from "./view-models/activities";
import ActivityViewModel from "./view-models/activity";
import UserViewModel from "./view-models/user";
import ImageViewModel from "./view-models/images";
import CategoriesViewModel from "./view-models/categories";

import ActivityComponent from "./components/activity_modal";
import NewActivityComponent from "./components/new_activity";
import ImageSearchResultsComponent from "./components/image_search_results";
import ActivitySearchComponent from "./components/activity_search";
import FeaturedActivityComponent from "./components/featured_activity";
import FooterComponent from "./components/footer";
import ActivitiesMngComponent from "./components/activities_manage";
import CategoriesComponent from "./components/categories";
import ImageSearch from "./components/image_search";


const ViewModel = function () {
  const self = this;
  self.channel = Postal.channel();
  self.user = new UserViewModel(self.channel);
  self.activities = new ActivitiesViewModel(self.channel);
  self.activity = new ActivityViewModel(self.activities, self.channel);
  self.categories = new CategoriesViewModel(self.channel);
  self.images = new ImageViewModel(self.channel);

  new Router({channel: self.channel});

  Backbone.history.start();
};

let registerComponent = component => {
  ko.components.register(component.name, {
    viewModel: component.viewModel,
    template: component.template
  });
};

let _components = [
  ActivityComponent,
  NewActivityComponent,
  ImageSearchResultsComponent,
  ActivitySearchComponent,
  FeaturedActivityComponent,
  FooterComponent,
  ActivitiesMngComponent,
  CategoriesComponent,
  ImageSearch
];

for (let i = 0, l = _components.length; i < l; i++)  {
  registerComponent(_components[i]);
}

ko.applyBindings(new ViewModel(), document.getElementById("activities"));