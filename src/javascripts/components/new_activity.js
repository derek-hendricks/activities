import ko from 'knockout';
import _ from 'underscore';

const newActivityComponent = {
  name: 'new-activity',
  viewModel: function (params) {
    var self = this;
    var channel = params.channel;

    self.email = ko.observable();
    self.activity = ko.observable();
    self.participants = ko.observable();
    self.start_date = ko.observable();
    self.description = ko.observable();

    self.newActivity = function() {
      if (!self.activity()) return;
      var activity_data = null;
      var queue = d3.queue(1);

      queue.defer(createActivity);
      queue.defer(createUser);
      queue.await(function(err) {
      });

      function createUser(callback) {
        var query = {_id: activity_data.organizer_id};
        var update = {$addToSet: {'activities': activity_data._id}, $set: {'organizer': true}};
        var upsert = {upsert: true};
        channel.publish('create.update.user', {
          query: query, update: update, upsert: upsert, activity: activity_data._id,
          callback: function(err, _model) { return callback(err) }
        });
      };

      function createActivity(callback) {
        activity_data = {
          activity: self.activity(), organizer_id: self.email() || 'mail@activities.ca', participants: self.participants(),
          description: self.description(), img: '/clipboard.png', start_date: self.start_date() && new Date(self.start_date()).toISOString(), created_at: new Date()
        };
        channel.publish('activity.create', {activity: activity_data, callback: function(err, model) {
          if (err) return callback(err);
          activity_data._id = model.id;
          updateActivitiesViewModel(model);
          callback(null);
        }});
      };

      var updateActivitiesViewModel = function(model) {
        self.email(''); self.activity('');
        self.description(''); self.participants(''); self.start_date('');
        channel.publish('activity.added', {model: model});
      };
  };
},

template: '\
  <div class="row">\
    <div class="col-md-6">\
      <div class="row">\
        <div class="col-md-6 new-form-1">\
          <input autofocus class="form-control" data-bind="value: activity" type="text" placeholder="Activity" name="activity"\>\
        </div>\
        <div class="col-md-6 new-form-1 left">\
          <input class="form-control" id="date" data-bind="value: start_date" type="date" placeholder="Date"\>\
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
          <textarea class="form-control" rows="3" data-bind="value: description" type="text" placeholder="Details"></textarea>\
        </div>\
      </div> <br/>\
      \
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

module.exports = newActivityComponent;
