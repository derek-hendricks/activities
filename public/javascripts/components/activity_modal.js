define([
  'knockout',
], function(ko) {

  const ActivityComponent = {
    vm: function (params) {
      var self = this, user_model;
      // activity info
      self.activity = ko.observable();
      self.description = ko.observable();
      self.activity_organizer = ko.observable();
      self.participants = ko.observableArray([]);
      self.activity_date = ko.observable();

      // user info
      self.organizer_email = ko.observable();
      self.organizer_name = ko.observable();

      params.model.subscribe(function(model) {
        if (model) self.getActivityInfo(model);
      });

      params.user_model.subscribe(function(model) {
        if (model) self.getUserInfo(model);
      });

      self.getActivityInfo = function(model) {
        self.activity(model.get('activity'));
        self.description(model.get('description'));
        self.participants(model.get('participants'));
        self.activity_date(model.get('start_date'));
      };

      self.getUserInfo = function(model) {
        self.organizer_email(model.get('email'));
        self.organizer_name(model.get('name'));
      };

      self.editActivity = function() {
        console.log('edit activity:', self.activity_id());
      };

      self.removeActivity = function() {
        params.channel.publish('activity.remove', {user_model: user_model, callback: function(err) {
          if (err) return console.log(err);
          console.log('remove success');
        }});
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
                  <h4 class="modal-title" data-bind="text: model.get(\"_id\")" id="myModalLabel"></h4>\
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



