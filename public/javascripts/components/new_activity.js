define([
  'knockout',
  'activity_model',
  'utils'
], function(ko, ActivityModel, Utils) {

  const newActivityComponent = {
    vm: function (params) {
      var self = this;
      var activityModel = null, activitiesViewModel = null, organizer_user;
      var userViewModel = params.userViewModel;

      self.first_name = ko.observable();
      self.last_name = ko.observable();
      self.email = ko.observable();
      self.activity = ko.observable();
      self.participants = ko.observableArray([]);
      self.start_date = ko.observable();
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
          organizer_user = {email: self.email(), organizer: true, participant: true,activities: []};
          userViewModel.newUser(organizer_user, function(err, _model, _user) {
            if (err) return (console.log(err), callback(err));
            user_model = _model;
            callback(null);
          });
        };

        function createActivity(callback) {
          activitiesViewModel = params.activitiesViewModel;
          activity_data = {
            activity: self.activity(),
            organizer_id: user_model.id,
            participants: self.participants(),
            description: self.description() || null,
            img: '/clipboard.png',
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
      <div class="col-md-6">\
        <div class="row">\
          <div class="col-md-6 new-form-1">\
            <input class="form-control" data-bind="value: activity" type="text" placeholder="Activity" name="activity"\>\
          </div>\
          <div class="col-md-6 new-form-1 left">\
            <input class="form-control" data-bind="value: start_date" type="date" placeholder="Activity Date"\>\
          </div>\
        </div>\
        \
        <div class="row">\
          <div class="col-md-6 new-form-1">\
            <input class="form-control" data-bind="value: email" type="text" placeholder="Organizer Email"\>\
          </div>\
          <div class="col-md-6 new-form-1 left">\
            <input class="form-control" data-bind="value: participants" type="text" placeholder="Participants"\>\
          </div>\
        </div>\
        \
        <div class="row">\
          <div class="col-md-6">\
            <textarea class="form-control" rows="3" data-bind="value: description" type="text" placeholder="Description"></textarea>\
          </div>\
        </div> <br/>\
        <div class="row">\
                  <div class="col-md-6">\
            <button class="btn btn-primary" data-bind="click: newActivity" type="button">Create New</button>\
          </div>\
          </div>\
        \
      </div>\
    </div>\
  '
  }
  return newActivityComponent;
});