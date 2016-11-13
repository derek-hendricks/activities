define([
  'knockout',
  'underscore',
  'image_model'
], function(ko, _, Image) {

  const ActivityComponent = {
    vm: function (params) {
      var self = this, user_model;
      self.channel = params.channel;

      self.activity_model = ko.observable();
      self.activity_name = ko.observable();
      self.description = ko.observable();
      self.activity_organizer = ko.observable();
      self.participants = ko.observableArray([]);
      self.start_date = ko.observable();
      self.image = ko.observable();

      self.organizer_email = ko.observable();
      self.userActivities = ko.observableArray([]);

      self.images = ko.observableArray([]);
      self.imageData = ko.observable({index: 0, sets: 0, message: 'Click to view images'});

      self.edit_mode = ko.observable(false);

      params.model.subscribe(function(model) {
        if (model) {
          self.channel.publish('view.images', {images: []});
          self.getActivityInfo(model, true);
        }
      });

      params.user_model.subscribe(function(model) {
        if (model) {
          user_model = model;
          self.getUserInfo(model);
        }
      });

      params.userActivities.subscribe(function(models) {
        if (models) self.getUserActivities(models);
      });

      self.getActivityInfo = function(model, set) {
        self.activity_model(model);
        self.activity_name(model.get('activity'));
        self.description(model.get('description'));
        self.participants(model.get('participants'));
        self.image(model.get('img'));
        self.start_date(model.get('start_date'));
      };

      self.getUserInfo = function(model) {
        self.organizer_email(model.get('email'));
      };

      self.getUserActivities = function(models) {
        self.userActivities(models);
      };

      self.toggleEditActivity = function() {
        if (self.edit_mode() == true) {
          self.getActivityInfo(self.activity_model(), false);
        }
        self.edit_mode(!self.edit_mode());
      };

      self.removeActivity = function() {
        self.channel.publish('activity.remove', {user_model: user_model, callback: function(err) {
          if (err) return console.log(err);
        }});
      };

      self.saveChanges = function() {
        self.edit_mode(!self.edit_mode());
        var attributes = {activity: self.activity_name(), img: self.image(), description: self.description(), start_date: self.start_date(), participants: self.participants()};
        var query = {$set: attributes};
        self.channel.publish('activity.update', {model: self.activity_model(), query: query, attributes: attributes, callback: function(err, model) {
          if (err) return console.log(err);
					if (self.activity_model()._previousAttributes.activity !== attributes.activity) {
            self.channel.publish('view.images', {images: []});
          }
				}});
      };

      self.changeUserActivity = function(model, event) {
        var current_model = self.activity_model();
        var activity_models = _.extend(self.userActivities());
        self.getActivityInfo(model, true);
        var index = activity_models.indexOf(model);
        activity_models.splice(index, 1, current_model);
        self.getUserActivities(activity_models);
        self.channel.publish('view.images', {images: []});
      };

      self.viewImages = function() {
        self.channel.publish('view.images', {text: self.activity_name(), id: self.activity_model().id});
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
                  <h4 class="modal-title" data-bind="text: activity_name, visible: !edit_mode()" id="myModalLabel"></h4>\
                  <input autofocus class="form-control" data-bind="value: activity_name, visible: edit_mode"/>\
                </div>\
                <div class="col-md-6">\
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
                </div>\
              </div>\
            </div>\
            <div class="modal-body">\
              <div class="row">\
              <div class="col-md-7">\
              <div class="row">\
                <div class="col-md-4">\
                  <p>Activity Date:</p>\
                </div>\
                <div class="col-md-8">\
                  <p data-bind="text: start_date, visible: !edit_mode()"></p>\
                  <input class="form-control modal-input-1-date" data-bind="value: start_date, visible: edit_mode" type="date"/>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col-md-4"><p>Organizer:</p></div>\
                <div class="col-md-8">\
                  <a data-bind="click: viewUserProfile">\
                    <p data-bind="text: organizer_email"></p>\
                  </a>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col-md-4">\
                  <p>Participants:</p>\
                </div>\
                <div class="col-md-8">\
                  <p data-bind="text: participants, visible: !edit_mode()"></p>\
                  <input class="form-control modal-input-1-date" data-bind="value: participants, visible: edit_mode"/>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col-md-4"><p>Details:</p></div>\
                <div class="col-md-8">\
                  <div class="description" data-bind="text: description, visible: !edit_mode()"></div>\
                  <div class="form-group">\
                    <textarea class="form-control" rows="3" data-bind="value: description, visible: edit_mode" type="text" placeholder="Details"></textarea>\
                  </div>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col-md-4">\
                  <p data-bind="visible: userActivities().length > 0">Organizer\'s Activities:</p>\
                </div>\
                <div class="col-md-8">\
                   <div class="user-activities">\
                     <div data-bind="foreach: userActivities">\
                        <a data-bind="click: $parent.changeUserActivity, text: attributes.activity"></a><br/>\
                      </div>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              <div class="col-md-3 activity-img-container">\
                <div class="activity-img">\
                  <img style="width: inherit; height: inherit" data-bind="attr: {src: image}"\>\
                  <a data-bind="click: viewImages, text: imageData().message"></a>\
                </div>\
              </div>\
              </div>\
              <images params="channel: channel, imageData: imageData, images: image, image: image"></images>\
            </div>\
            <div class="modal-footer">\
              <div class="row">\
                <div class="col-md-4 remove-activity">\
                  <button data-bind="click: removeActivity" type="button" class="btn btn-default" data-dismiss="modal">Remove Activity</button>\
                </div>\
                <div class="col-md-8">\
                  <button data-bind="visible: !edit_mode()" type="button" class="btn btn-default" data-dismiss="modal">Close</button>\
                  <button data-bind="click: toggleEditActivity, visible: !edit_mode()" type="button" class="btn btn-primary">Edit Activity</button>\
                  \
                  <button data-bind="click: toggleEditActivity, visible: edit_mode" type="button" class="btn btn-default">Cancel</button>\
                  <button data-bind="click: saveChanges, visible: edit_mode" type="button" class="btn btn-primary">Save Changes</button>\
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