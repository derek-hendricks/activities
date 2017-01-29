import ko from "knockout";
import _ from "underscore";
import utils from "../utils";

const ViewModel = function (channel) {
  const self = this;
  let collection, activityModel;
  self.activities = ko.observableArray([]);
  self.page_index = ko.observable(0).extend({
    deferred: true
  });
  self.channel = channel;

  self.channel.subscribe("activities.load", data => {
    self.activities(data.response.activities);
    collection = data.collection;
    activityModel = collection;
  });

  self.activityPages = ko.computed(() => {
    let featured, activities;
    if (self.activities().length < 1) {
      return [];
    }
    self.activities.sort(utils.prioritySort);
    featured = _.findIndex(self.activities(), {
      feature: "true"
    });
    if (featured > 0) {
      self.activities.splice(0, 0, self.activities.splice(featured, 1)[0]);
    }
    activities = self.activities().slice();
    activities.shift();
    return setPages(activities);
  }, self).extend({
    deferred: true
  });

  let setPages = (activities) => {
    let ref, current = [], cols = 4, page_num = 20, pages = [], rows = [];
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

  self.setPage = (index, data, event) => {
    self.page_index(index());
  }

  self.getActivity = (attr, value) => {
    let index = self.activities().findIndex((_activity) =>
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

  self.channel.subscribe("activity.search", data => {
    let search, suggestions = [], index, input;
    input = data.value.toLowerCase();
    for (let i = 1, l = self.activities().length; i < l; i++) {
      index = self.activities()[i].activity.toLowerCase().indexOf(input);
      if (index > -1) {
        suggestions.push({
          activity: self.activities()[i],
          name: self.activities()[i].activity,
          index: index,
          length: data.value.length
        });
      }
    }
    suggestions.sort(utils.indexSort).sort(utils.lenSort);
    data.callback({
      err: suggestions[0] ? null : data.value,
      suggestions: suggestions
    });
  });

  self.channel.subscribe("feature.activity.set", data => {
    let index, previous;
    index = self.activities.indexOf(data.activity);
    previous = self.activities()[0];
    previous.feature = "false";
    self.activities.splice(0, 1, previous);
    self.activities.unshift((self.activities()).splice(index, 1)[0]);
  });

  self.activityRemoved = (model, id, index) => {
    model = model ? model : self.getActivityModel({
      id: id
    });
    index = index ? index : self.activities().indexOf(_.findWhere(self.activities(), {
      _id: model.id
    }));
    self.activities.splice(index, 1);
    collection.remove(model);
  };

  self.channel.subscribe("activity_collection.updated", data => {
    let index;
    collection.add(data.model, {
      merge: true
    });
    index = self.activities().indexOf(_.findWhere(self.activities(), {
      _id: data.model.id
    }));
    self.activities.splice(index, 1, data.model.attributes);
  });

  self.channel.subscribe("activities.modified", data => {
    let activity_data, activity, activities;
    activities = self.activities().slice();
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
    let queue, activity, query
    queue = d3.queue();
    queue.defer(callback => {
      self.channel.publish("users.delete", {
        callback(err) {
          callback(err);
        }
      });
    });
    queue.defer(callback => {
      activity = collection.models[0];
      query = {
        all: true
      };
      activity.destroy({
        data: {
          col: "activities",
          query: query
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
      if (data.callback) data.callback({
        err
      });
    });
  });

  self.channel.subscribe("activities.delete.selected", data => {
    let queue = d3.queue();
    queue.defer(callback => {
      self.channel.publish("users.delete", {
        callback(err) {
          callback(err);
        }
      });
    });
    queue.defer(callback => {
      let activity_index, query, activity_ids
      activity_ids = activities.map(activity => activity.id);
      query = {
        activities: {
          "_id": {
            "$in": activity_ids
          }
        }
      };
      activities[0].destroy({
        data: {
          col: "activities",
          query: query
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
    });
  });
};

module.exports = ViewModel;