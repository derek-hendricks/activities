import ko from "knockout";
import _ from "underscore";
import utils from "../utils";
import Queue from "../utils/d3-queue.min.js";

const ViewModel = function (channel) {
  const self = this;
  let collection, activityModel;
  self.channel = channel;

  self.activities = ko.observableArray([]);

  self.page_index = ko.observable(0).extend({
    deferred: true
  });

  self.onActivitySelect = (data) => {
    self.channel.publish("feature.image", data.activity);
    data.activity.feature = "true";
    self.channel.publish("feature.activity.set", { activity: data.activity });
  }

  self.channel.subscribe("Activities.load", data => {
    self.activities(data.response.activities);
    collection = data.collection;
    activityModel = collection;
  });

  self.activityPages = ko.computed(() => {
    if (self.activities().length < 1) return [];
    self.activities.sort(utils.prioritySort);
    let featured = _.findIndex(self.activities(), {
      feature: "true"
    });
    if (featured > 0) {
      self.activities.splice(0, 0, self.activities.splice(featured, 1)[0]);
    }
    let activities = self.activities.slice();
    activities.shift();
    return setPages(activities);
  }, self).extend({
    deferred: true
  });

  function setPages(activities) {
    const cols = 4, page_num = 20;
    let ref, current = [], pages = [], rows = [];
    rows.push(current);
    for (let i = 0, l = activities.length; i < l; i++) {
      ref = i + 1;
      current.push(activities[i]);
      if ((ref % cols) === 0 && (ref % page_num) !== 0) {
        current = [];
        rows.push(current);
      }
      if ((ref % page_num) === 0 && i !== activities.length - 1) {
        pages.push(rows);
        rows = [];
        current = [];
        rows.push(current);
      }
    }
    if (rows.length) pages.push(rows);
    return pages;
  }

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

  self.getActivityModel = query => {
    if (collection) {
      return collection.find(query);
    }
  };

  // self.channel.subscribe("activity.search", data => {
  //   let suggestions = [];
  //   const input = data.value.toLowerCase();
  //   for (let i = 0, l = self.activities().length; i < l; i++) {
  //     const index = self.activities()[i].activity.toLowerCase().indexOf(input);
  //     if (index > -1) {
  //       suggestions.push({
  //         activity: self.activities()[i],
  //         name: self.activities()[i].activity,
  //         index: index,
  //         length: data.value.length
  //       });
  //     }
  //   }
  //   suggestions.sort(utils.indexSort).sort(utils.lenSort);
  //   data.callback({
  //     err: suggestions[0] ? null : data.value,
  //     suggestions: suggestions
  //   });
  // });

  self.channel.subscribe("feature.activity.set", data => {
    let index = self.activities.indexOf(data.activity);
    let previous = self.activities()[0];
    previous.feature = "false";
    self.activities.splice(0, 1, previous);
    self.activities.unshift((self.activities()).splice(index, 1)[0]);
  });

  self.activityRemoved = (model, id, index) => {
    model = model ? model : self.getActivityModel({ id });
    index = index ? index : self.activities().indexOf(_.findWhere(self.activities(), {
      _id: model.id
    }));
    self.activities.splice(index, 1);
    collection.remove(model);
  };

  self.channel.subscribe("activity_collection.updated", data => {
    collection.add(data.model, { merge: true });
    const index = self.activities().indexOf(_.findWhere(self.activities(), {
      _id: data.model.id
    }));
    self.activities.splice(index, 1, data.model.attributes);
  });

  self.channel.subscribe("activities.modified", data => {
    var activity_data, activity;
    let activities = self.activities.slice();
    for (let i = 0, l = data.activities.length; i < l; i++) {
      activity_data = self.getActivity("_id", data.activities[i]._id);
      activity = Object.assign(activity_data.activity, data.activities[i]);
      activities.splice(activity_data.index, 1, activity);
    }
    self.activities(activities);
  });

  self.channel.subscribe("activity.added", data => {
    self.activities.push(data.model.attributes);
    collection.add(data.model);
  });

  self.channel.subscribe("delete.all", data => {
    let queue = Queue();
    queue.defer(callback => {
      self.channel.publish("users.delete", {
        callback(err) {
          callback(err);
        }
      });
    });
    queue.defer(callback => {
      let activity = collection.models[0];
      let query = { all: true };
      activity.destroy({
        data: {
          col: "activities",
          query
        },
        processData: true,
        success(models, response) {
          self.activities([]);
          collection.reset();
          callback()
        },
        error(err) {
          callback(err);
        }
      });
    });
    queue.await(err => {
      self.channel.publish("feature.image", {});
      if (data.callback) data.callback({ err });
    });
  });

  self.channel.subscribe("activities.delete.selected", data => {
    const queue = Queue();
    queue.defer(callback => {
      self.channel.publish("users.delete", {
        callback(err) {
          callback(err);
        }
      });
    });
    queue.defer(callback => {
      var activity_index;
      const activity_ids = activities.map(activity => activity.id);
      const query = {
        activities: {
          "_id": {
            "$in": activity_ids
          }
        }
      };
      activities[0].destroy({
        data: {
          col: "activities",
          query
        },
        processData: true,
        success(models, response) {
          for (let i = 0, l = activity_ids.length; i < l; i++) {
            activity_index = (self.getActivity("_id", activity_ids[i])).index;
            self.activityRemoved(null, activity_ids[i], activity_index);
          }
          callback();
        },
        error(err) {
          callback(err);
        }
      });
    });
    queue.await(err => {
      // TODO: success and error notification
    });
  });
};

export default ViewModel;