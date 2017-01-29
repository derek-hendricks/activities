import ko from "knockout";
import _ from "underscore";

const Categories = {
  name: "categories",
  viewModel(params) {
    const self = this;
    self.channel = params.channel;
    self.activity_settings = ko.observable({}).extend({deferred: true});
    self.categories = ko.observableArray([]).extend({deferred: true});

    params.activity_settings.subscribe(settings => {
      if (!settings) return;
      self.activity_settings(Object.assign(self.activity_settings(), settings));
      if (settings.active && !self.activity_settings().categories_toggled) {
        self.channel.publish("get.categories", {callback(data) {
          self.categories(data.categories);
          self.activity_settings(Object.assign(self.activity_settings(), {categories_toggled: true}));
        }});
      }

    });

  },

  template: `
    <div class="category-container">
      <div class="row category-settings">
        <div class="col-md-6 category-title">
          <p>Categories</p>
        </div>
      </div>
      <div class="row category-new">
        <div class="col-md-6">
          <p><span class="glyphicon glyphicon-plus"></span> &nbsp; Add</p>
        </div>
      </div>
    </div>
  `
}

module.exports = Categories;