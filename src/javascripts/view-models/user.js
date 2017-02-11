import ko from 'knockout';
import _ from 'underscore';
import UserModel from '../models/user';
import UserCollection from '../collections/user';

const ViewModel = function (channel) {
  const self = this;
  let collection;
  self.channel = channel;
  self.users = ko.observableArray([]);

  self.channel.subscribe('Users.load', function (data) {
    self.users(data.response.users);
    collection = data.collection;
  });

  self.channel.subscribe('users.delete', function (data) {
    debugger;
    let model = data.model || collection.models[0];
    if (!model) return;
    self.removeUsers({
      model: model
    }, data.callback);
  });

  function getUser(query) {
    if (collection) {
      return collection.find(query);
    }
  };

  self.channel.subscribe('fetch.user', function (data) {
    let user = getUser(data.query);
    if (user) {
      return data.callback(null, user);
    }
    fetchUser(data.query, data.callback);
  });

  function fetchUser(query, callback) {
    let model = new UserModel(query);
    model.fetch({
      success: function (model, response) {
        if (model.id) {
          return callback(null, model);
        }
      },
      error: function (err) {
        callback(err);
      }
    });
  };

  function updateUser(query, update, upsert, callback) {
    let model = new UserModel();
    model.save(null, {
      data: {
        update: update,
        query: query,
        upsert: upsert
      },
      processData: true,
      wait: true,
      success: function (model, response) {
        return callback(null);
      },
      error: function (err) {
        return callback(err);
      }
    });
  };

  self.channel.subscribe('create.update.user', function (data) {
    updateUser(data.query, data.update, data.upsert, function (err, result) {
      if (err) {
        return data.callback(err);
      }
      let user = getUser(data.query);
      if (user) {
        let activities = user.get('activities');
        activities.push(data.activity)
        user.set({
          activities: activities
        });
        collection.add(user, {
          merge: true
        });
      }
      data.callback(err, result);
    });
  });

  self.channel.subscribe('remove.user.activity', function (data) {
    let model = data.user_model || getUser({ _id: data._id });
    let activities = model.get('activities');
    const index = activities.indexOf(data.activity_id);
    activities.splice(index, 1);
    model.set({
      activities: activities
    });
    const update = {
      '$pull': {
        'activities': data.activity_id
      }
    };
    updateUser({
      _id: model.id
    }, update, null, function (err) {
      if (data.callback) data.callback(err);
    });
  });

  self.removeUsers = function (data, callback) {
    let query;
    if (data.users) {
     query = {
        '_id': {
          '$in': data.users.map((user) => {
            return user.id
          })
        }
      };
    }
    data.model.destroy({
      data: {
        col: 'users',
        query: query || {}
      },
      processData: true,
      success: function (models, response) {
        collection.reset();
        self.users([]);
        callback()
      },
      error: function (err) {
        return callback(err);
      }
    });
  };

};

export default ViewModel;