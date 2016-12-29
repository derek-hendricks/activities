import ko from 'knockout';
import _ from 'underscore';

const ViewModel = function(channel) {
  var self = this;
  self.activitiesCollection = ko.observable();
  self.activities = ko.observableArray([]);
  self.channel = channel;

  self.activityRows = ko.computed(function() {
    var rows = [], current = [], activities;
    rows.push(current);
    activities = self.activities().slice();
    activities.shift();
    for (var i = 0; i < activities.length; i++) {
      current.push(activities[i]);
      if (((i + 1) % 4) === 0) {
        current = [];
        rows.push(current);
      }
    }
    return rows;
  }, self);

  self.getActivity = function(attr, value) {
    return self.activities().find(function(activity) {
      return activity[attr].toLowerCase() === value.toLowerCase();
    });
  };

  self.channel.subscribe('activity.search', function(data) {
    var activity = self.getActivity(data.attr, data.value), suggestions = [], index;
    if (!activity) {
      for (var i = 0; i < self.activities().length; i++) {
        index = self.activities()[i].activity.toLowerCase().indexOf(data.value.toLowerCase());
        if (index > -1) {
          suggestions.push({
            activity: self.activities()[i],
            name: self.activities()[i].activity,
            index: index,
            length: data.value.length
          });
        }
      }
      function indexSort(a, b) {
        if (a.index < b.index) return -1;
        if (a.index > b.index) return 1;
        return 0;
      }
      function lenSort(a, b) {
        if (a.length <= b.length && a.index >= b.index) return 1;
        if (a.length >= b.length && a.index <= b.index) return -1;
        return 0;
      }
      suggestions.sort(indexSort).sort(lenSort);
      return data.callback({err: 'Could not find ' + data.value, suggestions: suggestions, activity: null});
    }
    self.channel.publish('feature.activity.set', {activity: activity});
    data.callback({err: null, suggestions: suggestions, activity: activity});
  });

  self.getActivityModel = function(query) {
    if (self.activitiesCollection()) {
      return self.activitiesCollection().find(query);
    }
  };

  self.channel.subscribe('feature.activity.set', function(data) {
    var index = self.activities.indexOf(data.activity);
    self.activities.unshift((self.activities()).splice(index, 1)[0]);
  });

  self.activityRemoved = function(model) {
    var index = self.activities().indexOf(_.findWhere(self.activities(), {_id: model.id}));
    self.activities.splice(index, 1);
    self.activitiesCollection().remove(model);
  };

  self.channel.subscribe('activity_collection.updated', function(data) {
    self.activitiesCollection().add(data.model, {merge: true});
    var index = self.activities().indexOf(_.findWhere(self.activities(), {
      _id: data.model.id
    }))
    self.activities.splice(index, 1, _.clone(data.model.attributes));
  });

  self.channel.subscribe('activity.added', function(data) {
    self.activities.unshift(data.model.attributes);
    self.activitiesCollection().add(data.model);
  });

  self.deleteAll = function() {
    var queue = d3.queue();
    queue.defer(function(callback) {
      self.channel.publish('users.delete', {
        callback: function(err) {
          callback(err);
        }
      });
    });
    queue.defer(function(callback) {
      var activities = self.activitiesCollection().models;
      var activity_ids = activities.map(function(activity) {
        return activity.id
      });
      var query = {
        '_id': {
          '$in': activity_ids
        }
      };
      activities[0].destroy({
        data: {
          col: 'activities',
          query: query
        },
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
      if (err) return console.log(err);
      console.log('all users and activities deleted');
    });
  };

};

module.exports = ViewModel;