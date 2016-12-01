import Backbone from 'backbone';
import _ from 'underscore';
import ActivityCollection from './collections/activity';
import UserCollection from './collections/user';
import ActivityModel from './models/activity';
import UserModel from './models/user';

var self;

const fetchCollection = function(Collection, viewModel, viewCollection, values) {
  var collection = new Collection();
  collection.fetch({
    success: function(_collection, response) {
      viewModel[values](response[values]);
      viewModel[viewCollection](collection);
    },
    error: function(response) {
      console.log(response);
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
    self.channel = options.channel;
    self.activitiesViewModel = options.activitiesViewModel;
    self.activityViewModel = options.activityViewModel;
    self.userViewModel = options.userViewModel;

    fetchCollection(ActivityCollection, self.activitiesViewModel, 'activitiesCollection', 'activities');
    fetchCollection(UserCollection, self.userViewModel, 'userCollection', 'users');
  },


  routes: {
    'activities/:id': 'getActivity'
  },

  getActivity: function(activity_id) {
    self.channel.publish('activity.show', {
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




