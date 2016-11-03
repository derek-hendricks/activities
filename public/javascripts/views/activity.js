define([
	'knockout',
	'underscore',
	'user_model',
	'user_collection'
], function (ko, _, UserModel, UserCollection) {

	const ViewModel = function (activitiesViewModel, userViewModel) {
		var self = this;

		self.activity_id = ko.observable(false);
		self.model = ko.observable();
		self.userViewModel = userViewModel;
		self.activitiesViewModel = activitiesViewModel;
		self.self = self;

		self.show = function(id) {
			self.activity_id(id);
			var model = self.activitiesViewModel.getActivityModel({_id: id});
			self.model(model);
		};

		self.remove = function(id, user_model, callback) {
			self.model().destroy({data: {db: 'activities'},
			  processData: true,
			  success: function(model, response) {
					self.activitiesViewModel.activityRemoved(model);
					self.userViewModel.removeUserActivity(user_model, id, callback);
        }, error: function(err) {
				  return callback(err);
			  }
		  });
		};
	};

	return ViewModel;
});