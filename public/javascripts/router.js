define([
'backbone',
'activity_model',
'user_model',
'activity_collection',
'user_collection',
'underscore'
], function (Backbone, ActivityModel, UserModel, ActivityCollection, UserCollection, _) {

  var self;

  const getCollection = function(Collection, viewModel, viewCollection, values) {
    var collection = new Collection();
    collection.fetch({
      success: function(_collection, response) {
        viewModel[values](response[values]);
        viewModel[viewCollection](collection);
      },
      error: function(response) {
        throw new Error(response.responseText);
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

      getCollection(ActivityCollection, self.activitiesViewModel, 'activitiesCollection', 'activities');
      getCollection(UserCollection, self.userViewModel, 'userCollection', 'users');
    },

    routes: {
      'activities/:id': 'getActivity',
      'users/:id' : 'getUser',
      "": 'index'
    },

    getActivity: function(activity_id) {
      console.log('router: id', activity_id);
      self.channel.publish('activity.show', {
        id: activity_id,
        getActivityModel: function(callback) {
          getModel(ActivityModel, activity_id, callback);
        },
        getUserModel: function(user_id, callback) {
          getModel(UserModel, user_id, callback);
        }
      });
    },

    getUser: function(id) {
      console.log('router: getUser: id', id);
      // get from collection
    },

    index: function() {
    }
  });

  return AppRouter;
});



