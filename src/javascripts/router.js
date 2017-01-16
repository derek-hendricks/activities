import Backbone from 'backbone';
import _ from 'underscore';
import ActivityCollection from './collections/activity';
import UserCollection from './collections/user';
import CategoryCollection from './collections/category';
import ActivityModel from './models/activity';
import UserModel from './models/user';

var self, channel;

const fetchCollection = function(Collection, value, channel) {
  var collection = new Collection();
  collection.fetch({
    success: function(_collection, response) {
      channel.publish(value, {response: response, collection: collection});
    },
    error: function(err) {
      channel.publish(value, {err: err});
    }
  });
};

const getModel = function(Model, id, callback) {
  var model = new Model({_id: id});
  model.fetch({success: function(_model, response) {
    callback(null, _model);
  }, error: function(err) {
    callback(err);
  }});
};

var AppRouter = Backbone.Router.extend({
  initialize: function(options) {
    self = this;
    channel = options.channel;

    fetchCollection(ActivityCollection, 'activities.load', channel);
    fetchCollection(UserCollection, 'users.load', channel);
    fetchCollection(CategoryCollection, 'categories.load', channel);
  },

  routes: {
    'activities/:id': 'getActivity'
  },

  getActivity: function(activity_id) {
    channel.publish('activity.show', {
      id: activity_id,
      getActivityModel: function(callback) {
        getModel(ActivityModel, activity_id, callback);
      },
      getUserModel: function(user_id, callback) {
        getModel(UserModel, user_id, callback);
      }
    });
  }
});

module.exports = AppRouter;




