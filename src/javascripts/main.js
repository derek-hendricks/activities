import Backbone from "backbone";
import ko from "knockout";
import Postal from "postal";
import "./utils/knockout.dragdrop";

import Router from "./router";

import * as ViewModels from "./view-models";
import * as Components from './components'

const ViewModel = function () {
  const self = this;
  self.channel = Postal.channel();
  self.activities = new ViewModels.Activities(self.channel);
  self.activity = new ViewModels.Activity(self.activities, self.channel);
  new ViewModels.User(self.channel);
  new ViewModels.Categories(self.channel);
  new ViewModels.Image(self.channel);

  new Router({channel: self.channel});

  Backbone.history.start();
};

for (let key in Components) {
  registerComponent(Components[key]);
}

function registerComponent(component) {
  ko.components.register(component.name, {
    viewModel: component.viewModel,
    template: component.template
  });
};

ko.applyBindings(new ViewModel(), document.getElementById("activities"));