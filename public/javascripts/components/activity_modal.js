define([
  'knockout',
], function(ko) {

  const ActivityComponent = {
   view: function (params) {
   var self = this, activity_data, user_model;
    self.activity_id = params.viewModel.activity_id;
    self.activitiesViewModel = params.viewModel.activitiesViewModel;
    self.userViewModel = params.viewModel.userViewModel;

    // activity info
    self.activity = ko.observable();
    self.description = ko.observable();
    self.activity_organizer = ko.observable();
    self.participants = ko.observableArray([]);
    self.activity_date = ko.observable();

    // user info
    self.organizer_email = ko.observable();
    self.organizer_name = ko.observable();

    self.activity_id.subscribe(function(id) {
      console.log('activity_id', id);
      if (id) {
        self.getActivityInfo(id);
      }
    });

    self.getActivityInfo = function(id) {
      activity_data = self.activitiesViewModel.getActivity(id);
      self.getUserInfo(activity_data.organizer_id);
      self.activity(activity_data.activity);
      self.description(activity_data.description);
      self.participants(activity_data.participants);
      self.activity_date(activity_data.start_date);
    };

    self.getUserInfo = function(id) {
      user_model = self.userViewModel.getUser({_id: id});
      console.log('user_model', user_model);
      self.organizer_email(user_model.get('email'));
      self.organizer_name(user_model.get('name'));
    };

    self.editActivity = function() {
      console.log('edit activity:', self.activity_id());
    };

    self.removeActivity = function() {
      params.viewModel.remove(self.activity_id(), user_model, function(err, result) {
        if (err) return console.log(err);
        console.log('remove success');
      });
    };

    self.viewUserProfile = function() {
      console.log('view user profile');
    };
  },

  template: '\
    <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">\
      <div class="modal-dialog" role="document">\
        <div class="modal-content">\
          <div class="modal-header">\
            <div class="row">\
              <div class="col-md-6">\
                <h4 class="modal-title" data-bind="text: activity" id="myModalLabel"></h4>\
              </div>\
              <div class="col-md-6">\
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
              </div>\
            </div>\
          </div>\
          <div class="modal-body">\
          <div class="row">\
              <div class="col-md-3">\
                <p>Activity Date:</p>\
              </div>\
              <div class="col-md-3">\
                <p data-bind="text: activity_date"></p>\
              </div>\
            </div>\
            <div class="row">\
              <div class="col-md-3"><p>Organizer:</p></div>\
              <div class="col-md-3">\
                <a data-bind="click: viewUserProfile">\
                  <p data-bind="text: organizer_email"></p>\
                </a>\
              </div>\
              <div class="col-md-3"></div>\
            </div>\
            <div class="row">\
              <div class="col-md-3">\
                <p>Participants:</p>\
              </div>\
              <div class="col-md-3">\
                <p data-bind="text: participants"></p>\
              </div>\
            </div>\
            <div class="row">\
              <div class="col-md-3"><p>Description:</p></div>\
              <div class="col-md-8 description">\
                <p data-bind="text: description"></p>\
              </div>\
            </div><br/><br/>\
            <div class="row">\
              <div class="col-md-3">\
              </div>\
            </div>\
          </div>\
          <div class="modal-footer">\
            <div class="row">\
              <div class="col-md-4 remove-activity">\
                <button data-bind="click: removeActivity" type="button" class="btn btn-default" data-dismiss="modal">Remove Activity</button>\
              </div>\
              <div class="col-md-8">\
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\
                <button data-bind="click: editActivity" type="button" class="btn btn-primary">Edit Activity</button>\
              </div>\
            </div>\
          </div>\
        </div>\
      </div>\
    </div>\
  '
  }
  return ActivityComponent;
});



