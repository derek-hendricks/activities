define([
	'knockout',
	'underscore',
	'user_model',
	'user_collection'
], function (ko, _, UserModel, UserCollection) {

	const ViewModel = function (activitiesViewModel, userViewModel, channel) {
		var self = this;
		self.model = ko.observable();
		self.user_model = ko.observable();
		self.userViewModel = userViewModel;
		self.activitiesViewModel = activitiesViewModel;
		self.channel = channel;

		var show = channel.subscribe('activity.show', function(data) {
			var model = self.activitiesViewModel.getActivityModel({_id: data.id});
			if (model) {
				self.model(model);
				var user = self.userViewModel.getUser({_id: model.get('organizer_id')});
				self.user_model(user);
			} else {
				data.getActivityModel(function(err, _model) {
					if (err) return callback(err);
					self.model(_model);
					getUser(_model.get('organizer_id'));
				});
				var getUser = function(user_id) {
          data.getUserModel(user_id, function(err, _user_model) {
					  if (err) return callback(err);
					  self.user_model(_user_model);
				  });
				};
			}
    });

	  channel.subscribe('activity.remove', function(data) {
		  var id = self.model().id;
			self.activitiesViewModel.activityRemoved(self.model());
			self.model().destroy({data: {db: 'activities'},
			  processData: true,
			  success: function(model, response) {
					if (!data.user_model) return data.callback();
					return self.userViewModel.removeUserActivity(data.user_model, id, data.callback);
        }, error: function(err) {
				  return data.callback(err);
			  }
		  });
	  });
	};

	return ViewModel;
});