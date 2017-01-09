import ko from 'knockout';
import _ from 'underscore';
import utils from '../utils';

const ViewModel = function(channel) {
  var self = this;
  self.activitiesCollection = ko.observable();
  self.activities = ko.observableArray([]);
  self.channel = channel;

  self.activityRows = ko.computed(function() {
    var rows = [], current = [], featured, activities;
    if (self.activities().length > 1) {
      self.activities.sort(utils.prioritySort);
      featured = _.findIndex(self.activities(), {feature: 'true'});
      if (featured > 0) {
        self.activities.splice(0, 0, self.activities.splice(featured, 1)[0]);
      }
      activities = self.activities().slice();
      activities.shift();
      rows.push(current);
      for (var i = 0, l = activities.length; i < l; i++) {
        current.push(activities[i]);
        if (((i + 1) % 4) === 0) {
          current = [];
          rows.push(current);
        }
      }
    }
    return rows;
  }, self);

  self.getActivity = function(attr, value) {
    var index = self.activities().findIndex(function(_activity) {
      return String(_activity[attr]).toLowerCase() === String(value).toLowerCase();
    });
    return {
      index: index,
      activity: self.activities()[index]
    };
  };

  self.getActivityModel = function(query) {
    if (self.activitiesCollection()) {
      return self.activitiesCollection().find(query);
    }
  };

  self.channel.subscribe('activity.search', function(data) {
    var search, suggestions = [], index, input;
    input = data.value.toLowerCase();
    for (var i = 1, l = self.activities().length; i < l; i++) {
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
    data.callback({err: suggestions[0] ? null : data.value, suggestions: suggestions});
  });

  self.channel.subscribe('feature.activity.set', function(data) {
    var index, previous;
    index = self.activities.indexOf(data.activity);
    previous = self.activities()[0];
    previous.feature = 'false';
    self.activities.splice(0, 1, previous);
    self.activities.unshift((self.activities()).splice(index, 1)[0]);
  });

  self.activityRemoved = function(model, id, index) {
    var model, index;
    model = model ? model : self.getActivityModel({id: id});
    index = index ? index : self.activities().indexOf(_.findWhere(self.activities(), {_id: model.id}));
    self.activities.splice(index, 1);
    self.activitiesCollection().remove(model);
  };

  self.channel.subscribe('activity_collection.updated', function(data) {
    var index;
    self.activitiesCollection().add(data.model, {merge: true});
    index = self.activities().indexOf(_.findWhere(self.activities(), {_id: data.model.id}));
    self.activities.splice(index, 1, data.model.attributes);
  });

  self.channel.subscribe('activities.modified', function(data) {
    var activity_data, activity, activities;
    activities = self.activities().slice();
    for (var i = 0, l = data.activities.length; i < l; i++)  {
      activity_data = self.getActivity('_id', data.activities[i]._id);
      activity = Object.assign(activity_data.activity, data.activities[i]);
      activities.splice(activity_data.index, 1, activity);
    }
    self.activities(activities);
  });

  self.channel.subscribe('activity.added', function(data) {
    self.activities.push(data.model.attributes);
    self.activitiesCollection().add(data.model);
  });

  self.channel.subscribe('delete.all', function(data) {
    var queue = d3.queue();
    queue.defer(function(callback) {
      self.channel.publish('users.delete', {
        callback: function(err) {
          callback(err);
        }
      });
    });
    queue.defer(function(callback) {
      var activity = self.activitiesCollection().models[0];
      var query = { all: true };
      activity.destroy({
        data: { col: 'activities', query: query },
        processData: true,
        success: function(models, response) {
          self.activities([]);
          self.activitiesCollection().reset();
          callback()
        },
        error: function(err) {
          return callback(err);
        }
      });
    });
    queue.await(function(err) {
      self.channel.publish('feature.image', {});
      data.callback({
        err: err
      });
    });
  });

  self.deleteActivities = function(activities) {
    var queue = d3.queue();
    queue.defer(function(callback) {
      self.channel.publish('users.delete', {
        callback: function(err) {
          callback(err);
        }
      });
    });
    queue.defer(function(callback) {
      var activity_index, query;
      var activity_ids = activities.map(function(activity) {
        return activity.id
      });
      query = {
        activities: {
          '_id': {
            '$in': activity_ids
          }
        }
      };
      activities[0].destroy({
        data: {
          col: 'activities',
          query: query
        },
        processData: true,
        success: function(models, response) {
          for (var i = 0, l = activity_ids.length; i < l; i++)  {
            activity_index = (self.getActivity('_id', activity_ids[i])).index;
            self.activityRemoved(null, activity_ids[i], activity_index);
          }
          callback();
        },
        error: function(err) {
          return callback(err);
        }
      });
    });
    queue.await(function(err) {
      if (err) return console.log(err);
      console.log('all users and activities deleted');
    });
  };

};

module.exports = ViewModel;
