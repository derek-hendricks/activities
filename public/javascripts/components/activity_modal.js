define([
  'knockout',
  'underscore',
  'image_model'
], function(ko, _, Image) {

  const ActivityComponent = {
    vm: function (params) {
      var self = this, user_model, previous_attributes, image_set = [0, 1];
      self.channel = params.channel;
      self.test = 'test';

      self.activity_model = ko.observable();
      self.activity_name = ko.observable();
      self.description = ko.observable();
      self.activity_organizer = ko.observable();
      self.participants = ko.observableArray([]);
      self.start_date = ko.observable();
      self.image = ko.observable();

      self.organizer_email = ko.observable();
      self.organizer_name = ko.observable();
      self.userActivities = ko.observableArray([]);

      self.imageCols = ko.observableArray([]);
      self.imageData = ko.observable({index: 0, sets: 0});
      self.images = ko.observableArray([]);

      self.edit_mode = ko.observable(false);

      params.model.subscribe(function(model) {
        if (model) {
          self.imageCols([]);
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
        self.organizer_name(model.get('name'));
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
					self.activity_model(model);
          self.imageCols([]);
				}});
      };

      self.changeUserActivity = function(model, event) {
        self.imageCols([]);
        var current_model = self.activity_model();
        var activity_models = _.extend(self.userActivities());
        self.getActivityInfo(model, true);
        var index = activity_models.indexOf(model);
        activity_models.splice(index, 1, current_model);
        self.getUserActivities(activity_models);
      };

      self.setImage = function(data, event) {
        self.image(data);
      };

      self.setImageSet = function(index, data, event) {
        self.imageData({index: index(), sets: self.images().length});
        self.imageCols(self.images()[self.imageData().index]);
      };

      self.nextImageSet = function() {
        var index = self.imageData().index;
        if (index == self.imageData().sets - 1) return;
        self.imageData({index: ++index, sets: self.images().length});
        self.imageCols(self.images()[self.imageData().index]);
      };

      self.previousImageSet = function() {
        var index = self.imageData().index;
        if (index == 0) return;
        self.imageData({index: --index, sets: self.images().length});
        self.imageCols(self.images()[self.imageData().index]);
      };

      self.viewImages = function() {
        self.channel.publish('image.rows', {activity: self.activity_name(), id: self.activity_model().id, callback: function(err, _images) {
          if (err) return console.log('err');
          self.images(_images);
          self.imageData({index: 0, sets: self.images().length});
          self.imageCols(self.images()[self.imageData().index]);
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
                    <textarea class="form-control" rows="3" data-bind="value: description, visible: edit_mode" type="text" placeholder="Description"></textarea>\
                  </div>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col-md-4">\
                  <p data-bind="visible: userActivities().length > 0">Organizer\'s other Activities:</p>\
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
              <div class="col-md-5 activity-img-container">\
                <div class="activity-img">\
                  <img style="width: inherit; height: inherit" data-bind="attr: {src: image}"\>\
                  <a data-bind="click: viewImages, visible: imageCols().length == 0"> View images related to <span data-bind="text: activity_name"></span></a>\
                </div>\
              </div>\
              </div><br/>\
              <div class="row">\
                <div class="col-md-12 image-cols">\
                  <div class="row">\
                    <div data-bind="foreach: imageCols">\
                      <div class="image-col">\
                        <img data-bind="click: $parent.setImage, attr: {src: $data}"/>\
                      </div>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              <div class="row">\
                <div data-bind="visible: imageCols().length > 0" class="col-md-12 image-select">\
                  <div data-bind="foreach: images">\
                    <span class="image-col-select" data-bind="click: function(data,event){$parent.setImageSet($index,data,event);}, text: $index() + 1, css: {setselected: $index() == $parent.imageData().index}"></span>\
                  </div>\
                </div>\
              </div>\
              <div data-bind="visible: imageCols().length > 0" class="row">\
                <div class="col-md-4 previous-image">\
                  <img data-bind="click: previousImageSet"  src="./arrow.png"/>\
                </div>\
                <div class="col-md-4"></div>\
                <div class="col-md-4 next-image">\
                  <img data-bind="click: nextImageSet" src="./arrow.png"/>\
                </div>\
              </div>\
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