import ko from "knockout";
import _ from "underscore";
import Utils from "../utils";
import queue from "../utils/d3-queue.min.js";

const ViewModel = function (channel) {
  const self = this;
  let collection;
  self.channel = channel;
  self.activities = ko.observableArray([]);
  self.page_index = ko.observable(0).extend({
    deferred: true
  });

  self.onActivitySelect = (data) => {
    if (Object.is(data.activity._id, self.activities()[0]._id)) {
      return;
    }
    self.channel.publish("feature.image", data.activity);
    data.activity.feature = "true";
    self.channel.publish("feature.activity.set", {
      activity: data.activity
    });
  };

  self.channel.subscribe("Activities.load", (data) => {
    self.activities(data.response.activities);
    collection = data.collection;
  });

  self.activityPages = ko.computed(() => {
    let activities, featured;
    if (self.activities().length < 1) {
      return [];
    }
    self.activities.sort(Utils.prioritySort);
    featured = _.findIndex(self.activities(), {
      feature: "true"
    });
    if (featured > 0) {
      self.activities.splice(0, 0, self.activities.splice(featured, 1)[0]);
    }
    activities = self.activities.slice();
    activities.shift();

    return Utils.setPages(activities);
  }, self).extend({
    deferred: true
  });

  self.setPage = (index) => {
    self.page_index(index());
  }

  self.getActivity = (attr, value) => {
    const index = self.activities().findIndex((_activity) =>
      String(_activity[attr]).toLowerCase() === String(value).toLowerCase());

    return {
      index,
      activity: self.activities()[index]
    };
  };

  self.getActivityModel = (query) => collection.find(query);

  self.channel.subscribe("feature.activity.set", (data) => {
    const index = self.activities.indexOf(data.activity),
      previous = self.activities()[0];
    previous.feature = "false";
    self.activities.splice(0, 1, previous);
    self.activities.unshift((self.activities()).splice(index, 1)[0]);
  });

  self.activityRemoved = (model = self.getActivityModel({id}), id, index) => {
    if (!index) {
      self.activities().indexOf(_.findWhere(self.activities(), {
        _id: model.id
      }));
    }
    self.activities.splice(index, 1);
    collection.remove(model);
  };

  self.channel.subscribe("activity_collection.updated", (data) => {
    collection.add(data.model, {
      merge: true
    });
    const index = self.activities().indexOf(_.findWhere(self.activities(), {
      _id: data.model.id
    }));
    self.activities.splice(index, 1, data.model.attributes);
  });

  self.channel.subscribe("activities.modified", (data) => {
    let activity_data, activity,
      activities = self.activities.slice();
    for (let i = 0, l = data.activities.length; i < l; i += 1) {
      activity_data = self.getActivity("_id", data.activities[i]._id);
      activity = Object.assign(activity_data.activity, data.activities[i]);
      activities.splice(activity_data.index, 1, activity);
    }
    self.activities(activities);
  });

  self.channel.subscribe("activity.added", (data) => {
    self.activities.push(data.model.attributes);
    collection.add(data.model);
  });

  self.channel.subscribe("delete.all", (data) => {
    let queue = queue();
    queue.defer((callback) => {
      self.channel.publish("users.delete", {
        callback(err) {
          callback(err);
        }
      });
    });
    queue.defer((callback) => {
      let activity = collection.models[0];
      const query = {
        all: true
      };
      activity.destroy({
        data: {
          col: "activities",
          query
        },
        processData: true,
        success() {
          self.activities([]);
          collection.reset();
          callback();
        },
        error(err) {
          callback(err);
        }
      });
    });
    queue.await((err) => {
      self.channel.publish("feature.image", {});
      if (data.callback) {
        data.callback({
          err
        });
      }
    });
  });

  self.channel.subscribe("activities.delete.selected", (data) => {
    const queue = queue();
    queue.defer((callback) => {
      self.channel.publish("users.delete", {
        callback(err) {
          callback(err);
        }
      });
    });
    queue.defer((callback) => {
      const activity_ids = self.activities.map((activity) => activity.id),
        query = {
          activities: {
            "_id": {
              "$in": activity_ids
            }
          }
        };
      self.activities[0].destroy({
        data: {
          col: "activities",
          query
        },
        processData: true,
        success() {
          for (let i = 0, l = activity_ids.length; i < l; i += 1) {
            let activity_index = (self.getActivity("_id", activity_ids[i])).index;
            self.activityRemoved(null, activity_ids[i], activity_index);
          }
          callback();
        },
        error(err) {
          callback(err);
        }
      });
    });
    queue.await((err) => {
      data.callback(err);
    });
  });
};

export default ViewModel;