define([
  'knockout',
  'activity_model',
  'utils'
], function(ko, ActivityModel, Utils) {

  const newActivityComponent = {
    view: function (params) {
      var self = this;
      var activityModel = null, activitiesViewModel = null, organizer_user;
      var userViewModel = params.userViewModel;

      self.first_name = ko.observable();
      self.last_name = ko.observable();
      self.email = ko.observable();
      self.activity = ko.observable();
      self.participants = ko.observableArray([]);
      var today = Utils.formatDate(new Date(Date.now()))
      self.start_date = ko.observable(today);
      self.description = ko.observable();

      self.newActivity = function() {
        activityModel = new ActivityModel();
        var user = null, user_model = null, activity_data = null;
        var queue = d3.queue(1);

        queue.defer(checkActivityOrganizer);
        queue.defer(createActivity);
        queue.defer(updateUserActivities);
        queue.await(function(err) {
          if (err) throw new Error(err);
          updateActivitiesViewModel();
        });

        function checkActivityOrganizer(callback) {
          var _user_model, user_query;
          user_query = {email: self.email()}
          if (_user_model = userViewModel.getUser(user_query)) {
            user_model = _user_model;
            return callback(null);
          }
          return createUser(callback);
        };

        function createUser(callback) {
          organizer_user = {
            first_name: self.first_name(),
            last_name: self.last_name(),
            email: self.email(),
            organizer: true,
            participant: true,
            activities: []
          };
          userViewModel.newUser(organizer_user, function(err, _model, _user) {
            if (err) return (console.log(err), callback(err));
            user_model = _model;
            callback(null);
          });
        };

        function createActivity(callback) {
          // debugger;
          activitiesViewModel = params.activitiesViewModel;
          activity_data = {
            activity: self.activity(),
            organizer_id: user_model.id,
            participants: self.participants(),
            description: self.description() || null,
            start_date: self.start_date(),
            created_at: new Date(),
          };
          activityModel.save(activity_data, {
            wait: true,
            success: function(activity_model, response) {
              activity_data._id = activity_model.id;
              callback(null);
            },
            error: function(model, response) {
              callback(response.responseText);
            }
          });
        };

        function updateUserActivities(callback) {
          userViewModel.addUserActivities(user_model, activity_data, callback);
        };

        function updateActivitiesViewModel() {
          self.email(''); self.activity('');
          self.first_name(''); self.last_name('');
          self.description(''); self.participants(''); self.start_date('');
          activitiesViewModel.activityAdded(activityModel);
        };
		};
  },

  template: '\
    <div class="row">\
      <div class="col-md-6.float-left">\
        <input data-bind="value: email" type="text" placeholder="Organizer Email"\>\
        <input data-bind="value: first_name" type="text" placeholder="Organizer First Name"\>\
        <input data-bind="value: last_name" type="text" placeholder="Organizer Last Name"\>\
        <br>\
        <input data-bind="value: activity" type="text" placeholder="Activity" name="activity"\>\
        <br/>\
        <textarea data-bind="value: participants" type="text" placeholder="Participants"></textarea>\
        <br/>\
        <input data-bind="value: start_date" type="date" placeholder="Activity Date"\>\
        <br/>\
        <textarea data-bind="value: description" type="text" placeholder="Description"></textarea>\
        <br/>\
        <button data-bind="click: newActivity" type="button">Submit</button>\
      </div>\
    </div>\
  '
  }
  return newActivityComponent;
});