import ko from "knockout";
import _ from "underscore";

const Categories = {
  name: "categories",
  viewModel(params) {
    const self = this;
    self.channel = params.channel;

    self.categories = ko.observableArray([]);
    self.active_category = ko.observable();

    self.name = ko.observable().extend({
      deferred: true
    });

    self.activityData = {
      activities: [],
      category_activities: ko.observableArray([]).extend({
        deferred: true
      }),
      params_activities: ko.observableArray([])
    };

    params.activities.subscribe((activities) => {
      if (activities) {
        self.activityData.activities = activities;
        if (self.active_category()) {
          self.displayActivities({_id: self.active_category()});
        }
      }
    });

    let subscription = params.activity_settings.subscribe((settings) => {
      if (settings.active) {
        params.channel.publish("get.categories", {
          callback(data) {
            self.categories(data.categories);
            if (data.categories.length) {
              self.displayActivities(data.categories[0]);
            }
          }
        });
        subscription.dispose();
      }
    });

    self.displayActivities = (data) => {
      const category_activities = self.activityData.activities.filter(
        (activity) => {
          return activity.category_id === data._id;
        });
      self.activityData.category_activities(category_activities);
      paramsActivitiesDiff(self.activityData.activities, category_activities);
      self.active_category(data._id);
    };

    self.onActivitySelect = (data) => {
      const update = {
        $set: {
          category_id: self.active_category()
        }
      };
      self.channel.publish("activity.update", {
        _id: data.activity._id,
        update
      });
      updateActivity(data.activity, self.active_category());
    };

    function paramsActivitiesDiff(activities, category_activities) {
      let params_activities = _.difference(
        activities,
        category_activities
      );
      self.activityData.params_activities(params_activities);
    }

    function updateActivity(activity, ca_id) {
      activity.category_id = ca_id;
      self.activityData.category_activities.push(activity);
      for (let i = 0, l = self.activityData.activities.length; i < l; i++) {
        if (Object.is(self.activityData.activities[i]._id, activity._id)) {
          self.activityData.activities[i].category_id = ca_id;
          paramsActivitiesDiff(self.activityData.activities, self.activityData.category_activities());
        }
      }
    }

    self.newCategory = () => {
      const update = {
        $set: {
          created_at: new Date()
        }
      },
        query = {
          _id: self.name()
        },
        attr = {
          _id: self.name(),
          created_at: new Date()
        };
      params.channel.publish("category.create", {
        category: {
          attr,
          update,
          query,
          upsert: true
        }
      });
      self.categories.unshift(attr);
      self.active_category(attr._id);
      self.activityData.category_activities([]);
      self.name("");
    };
  },

  template: `
    <div class="category-container">
      <div class="row category-settings">
        <div class="col-md-6 category-title">
          <p><strong>Categories</strong></p>
        </div>
        <div data-bind="visible: active_category" class="col-md-6 category-title">
          <p><strong><span data-bind="text: active_category"></span></strong></p>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 category-name">
          <div data-bind="foreach: categories">
            <div class="category-cn"
              data-bind= "css: {categorySelected: $data._id === $parent.active_category()},
              click: $parent.displayActivities">
                <a data-bind="text: $data._id"></a>
            </div>
          </div>
        </div>
        <div class="col-md-5 category-activities">
          <div class="row">
            <div data-bind="with: activityData" class="col-md-12">
            <div data-bind="if: $parent.active_category() && category_activities().length < 1">
              <span data-bind="text: $parent.active_category"></span>
              <span>doesn't have any activities</span>
            </div>
              <div data-bind="display: category_activities().length >= 1, foreach: category_activities">
                <div class="category">
                  <p data-bind="text: $data.activity"></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row category-new">
        <div class="row">
          <div class="col-md-5">
            <div class="row">
              <div class="col-md-8 category-input-cn">
                <input data-bind="textInput: name" class="form-control" placeholder="Create Category">
              </div>
              <div class="col-md-3 add-category-col">
                <button data-bind="click: newCategory" class="form-control add-category">
                  <span class="glyphicon glyphicon-plus"></span>
                </button>
              </div>
            </div>
          </div>
          <div class="col-md-5" data-bind="with: activityData">
            <activity-search params=
              "channel: $parent.channel,
              activities: params_activities,
              placeholder: 'Add Activity',
              onActivitySelect: $parent.onActivitySelect">
            </activity-search>
          </div>
        </div>
      </div>
    </div>
  `
}

export default Categories;