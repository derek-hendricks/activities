import ko from 'knockout';
import _ from 'underscore';
import moment from 'moment';

const ActivityComponent = {
  name: 'activity-modal',
  viewModel: function (params) {
    var self = this, user_model, input = 3, search = true, ms = 500;
    self.channel = params.channel;
    self.image_columns = 5;

    self.activity_model = ko.observable();
    self.activity_name = ko.observable();
    self.description = ko.observable();
    self.activity_organizer = ko.observable();
    self.participants = ko.observableArray([]);
    self.start_date = ko.observable();
    self.image = ko.observable();

    self.organizer_email = ko.observable();
    self.user_activities = ko.observableArray([]);

    self.search = ko.observable();
    self.image_progress = ko.observable();
    self.edit_mode = ko.observable(false);

    params.model.subscribe(function(model) {
      if (!model) return;
      if (self.activity_model() && self.activity_model() == model) return;
      self.channel.publish('reset.images', {text: model.get('activity')});
      self.getActivityInfo(model, true);
      self.search('');
    });

    params.user_model.subscribe(function(model) {
      if (model) {
        user_model = model;
        self.getUserInfo(model);
        search = true;
      }
    });

    params.user_activities.subscribe(function(models) {
      if (models.length > 1) return self.user_activities(models);
      self.user_activities([]);
    });

    self.getActivityInfo = function(model, set) {
      self.activity_model(model);
      self.activity_name(model.get('activity'));
      self.description(model.get('description'));
      self.participants(model.get('participants'));
      self.image(model.get('img'));
      model.get('start_date') && self.start_date(moment(model.get('start_date')).format('MMMM DD, YYYY'));
    };

    self.getUserInfo = function(model) {
      self.organizer_email(model.id);
    };

    self.toggleEditActivity = function() {
      if (self.edit_mode() === true) {
        self.getActivityInfo(self.activity_model(), false);
      }
      self.edit_mode(!self.edit_mode());
    };

    self.removeActivity = function() {
      self.channel.publish('activity.remove', {
        model: self.activity_model(), user_model: user_model,
        callback: function(err) { if (err) return console.log(err) }
      });
      self.closeModal(null, null, 'activities');
    };

    self.saveChanges = function() {
      var user_activities, attributes, query;
      self.edit_mode(!self.edit_mode());
      attributes = {activity: self.activity_name(), img: self.image(), description: self.description(), participants: self.participants()};
      if (self.start_date() && self.start_date().indexOf('-') > -1) attributes.start_date = self.start_date();
      query = {$set: attributes};
      self.channel.publish('activity.update', {model: self.activity_model(), query: query, attributes: attributes, callback: function(err, model) {
        if (err) return;
        self.channel.publish('activity_collection.updated', {model: model});
        if (self.activity_model()._previousAttributes.activity !== attributes.activity) {
          user_activities = self.user_activities().slice();
          self.user_activities([]);
          self.user_activities(user_activities);
        }
      }});
    };

    self.search.subscribe(function(data, event) {
      data.length >= input && self.image_progress('Searching for ' + data);
      if (data.length < input || !search) return;
      search = !search;
      fetch(null, null, false);
      function fetch(_text, _ms, _save) { setTimeout(function() {
        self.channel.publish('image.search', {
          text: self.search(), save: _save,
          callback: function(err, data, callback) {
            if ((_text || data.text) !== self.search()) {
              return fetch(self.search(), 50, true);
            }
            self.image_progress(err ? err.message : '');
            search = !search;
            if (err) return;
            callback();
          }
        });
      }, _ms || ms)};
    });

    self.changeUserActivity = function(model, event) {
      self.getActivityInfo(model, true);
      self.user_activities.unshift((self.user_activities()).splice(self.user_activities.indexOf(model), 1)[0]);
    };

    self.closeModal = function(data, event, id) {
      window.location.href = '#' + (id === undefined ? self.activity_model().id : id);
      return true;
    }

    self.viewUserProfile = function() {
      console.log('view user profile');
    };
  },

  template: '\
    <div class="modal fade" id="activityModal" tabindex="-1" role="dialog" aria-labelledby="activityModalLabel">\
      <div class="modal-dialog" role="document">\
        <div class="modal-content">\
          <div class="modal-header">\
            <div class="row">\
              <div class="col-md-6">\
                <h4 class="modal-title" data-bind="text: activity_name, visible: !edit_mode()" id="activityModalLabel"></h4>\
                <input autofocus class="form-control" data-bind="value: activity_name, visible: edit_mode"/>\
              </div>\
              <div class="col-md-6">\
                <button type="button" class="close" data-bind="click: closeModal" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
              </div>\
            </div>\
          </div>\
          <div class="modal-body">\
            <div class="row">\
              <div class="col-xs-7">\
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
                  <p data-bind="visible: user_activities().length > 0">Organizer\'s Activities:</p>\
                </div>\
                <div class="col-md-8">\
                  <div class="user-activities">\
                    <div data-bind="foreach: user_activities">\
                      <a data-bind="click: $parent.changeUserActivity, text: get(\'activity\')"></a><br/>\
                    </div>\
                  </div>\
                </div>\
              </div>\
            </div>\
            <div class="col-xs-3">\
              <div class="search-input">\
                <input data-bind="textInput: search" class="form-control" placeholder="image search"/>\
                <div data-bind="text: image_progress"></div>\
              </div>\
              <div>\
                <div class="activity-img-container">\
                  <img class="activity-img" data-bind="attr: {src: image}"\>\
                </div>\
              </div>\
            </div>\
            </div>\
            <images params="channel: channel, columns: image_columns, image: image"></images>\
          </div>\
          <div class="modal-footer">\
            <div class="row">\
              <div class="col-xs-4 remove-activity">\
                <button data-bind="click: removeActivity" data-dismiss="modal" type="button" class="btn btn-default">Remove Activity</button>\
              </div>\
              <div class="col-xs-8">\
                <button data-bind="click: closeModal, visible: !edit_mode()" data-dismiss="modal" type="button" class="btn btn-default">Close</button>\
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

module.exports = ActivityComponent;