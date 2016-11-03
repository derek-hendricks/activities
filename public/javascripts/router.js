define([
'backbone',
'activity_model',
'activity_collection',
'user_collection',
'underscore'
], function (Backbone, ActivityModel, ActivityCollection, UserCollection, _) {

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

  var AppRouter = Backbone.Router.extend({
    initialize: function(options) {
      self = this;
      self.main = options.main;
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

    getActivity: (id) => {
      console.log('router: id', id);
      self.activityViewModel.show(id);
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



