import ko from "knockout";
import _ from "underscore";
import Queue from "../utils/d3-queue.min.js";

const newActivityComponent = {
  name: "new-activity",
  viewModel(params) {
    const self = this;
    let activity_data, queue;
    self.channel = params.channel;

    self.email = ko.observable().extend({
      deferred: true
    });
    self.activity = ko.observable().extend({
      deferred: true
    });
    self.participants = ko.observable().extend({
      deferred: true
    });
    self.start_date = ko.observable().extend({
      deferred: true
    });
    self.description = ko.observable().extend({
      deferred: true
    });

    self.newActivity = () => {
      if (!self.activity()) return;
      queue = Queue(1);

      queue.defer(createActivity);
      queue.defer(createUser);
      queue.await(err => {
        // TODO: success and error notification
      });
    };

    function createActivity(callback) {
      activity_data = {
        activity: self.activity(),
        feature: false,
        organizer_id: self.email() || "mail@activities.ca",
        participants: self.participants(),
        priority: new Date(),
        description: self.description(),
        img: "/images/activity-selected.png",
        start_date: self.start_date() && new Date(self.start_date()).toISOString(),
        created_at: new Date()
      };
      self.channel.publish("activity.create", {
        activity: activity_data,
        callback(err, model) {
          if (err) return callback(err);
          activity_data._id = model.id;
          updateActivitiesViewModel(model);
          callback(null);
        }
      });
    }

    function createUser(callback) {
      let  update, upsert, query;
      query = {
        _id: activity_data.organizer_id
      };
      update = {
        $addToSet: {
          activities: activity_data._id
        },
        $set: {
          organizer: true
        }
      };
      upsert = {
        upsert: true
      };
      self.channel.publish("create.update.user", {
        query: query,
        update: update,
        upsert: upsert,
        activity: activity_data._id,
        callback(err, _model) {
          return callback(err);
        }
      });
    }

    function updateActivitiesViewModel(model) {
      self.email("");
      self.activity("");
      self.description("");
      self.participants("");
      self.start_date("");
      self.channel.publish("activity.added", {
        model: model
      });
    };
  },

  template: `
  <div class="row">
    <div class="col-md-12">
      <div class="row">
        <div class="col-md-6 new-form-1">
          <input autofocus class="form-control" data-bind="value: activity" type="text" placeholder="Activity" name="activity">
        </div>
        <div class="col-md-6 new-form-1 left">
          <input class="form-control" id="date" data-bind="value: start_date" type="date" placeholder="Date">
        </div>
      </div>

      <div class="row">
        <div class="col-md-6 new-form-1">
          <input class="form-control" data-bind="value: email" type="text" placeholder="Organizer Email">
        </div>
        <div class="col-md-6 new-form-1 left">
          <input class="form-control" data-bind="value: participants" type="text" placeholder="Participants">
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <textarea class="form-control" rows="3" data-bind="value: description" type="text" placeholder="Details"></textarea>
        </div>
      </div> <br/>

      <div class="row">
        <div class="col-md-6">
          <button class="btn btn-primary" data-bind="click: newActivity" type="button">Create New</button>
        </div>
      </div>

    </div>
  </div>
`
}

export default newActivityComponent;