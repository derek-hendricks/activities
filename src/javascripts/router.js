import Backbone from 'backbone';

import ActivityModel from './models/activity';
import UserModel from './models/user';

import * as Collections from './collections'

let self, channel;

function fetchCollection(Collection, value, channel) {
  let collection = new Collection();
  collection.fetch({
    success: function (_collection, response) {
      channel.publish(value, {
        response: response,
        collection: collection
      });
    },
    error: function (err) {
      channel.publish(value, {
        err: err
      });
    }
  });
};

function getModel(Model, id, callback) {
  let model = new Model({
    _id: id
  });
  model.fetch({
    success: function (_model, response) {
      callback(null, _model);
    },
    error: function (err) {
      callback(err);
    }
  });
};

const AppRouter = Backbone.Router.extend({
  initialize: function (options) {
    self = this;
    channel = options.channel;

    for (let key in Collections) {
      fetchCollection(Collections[key], `${key}.load`, channel);
    }
  },

  routes: {
    'activities/:id': 'getActivity'
  },

  getActivity: function (activity_id) {
    channel.publish('activity.show', {
      id: activity_id,
      getActivityModel: function (callback) {
        getModel(ActivityModel, activity_id, callback);
      },
      getUserModel: function (user_id, callback) {
        getModel(UserModel, user_id, callback);
      }
    });
  }
});

module.exports = AppRouter;