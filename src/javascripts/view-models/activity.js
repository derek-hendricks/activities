import ko from "knockout";
import _ from "underscore";
import ActivityModel from "../models/activity";

const ViewModel = function (activitiesViewModel, channel) {
  const self = this;
  self.activitiesViewModel = activitiesViewModel;
  self.channel = channel;

  self.model = ko.observable().extend({
    deferred: true
  });
  self.user_model = ko.observable().extend({
    deferred: true
  });
  self.user_activities = ko.observableArray([]).extend({
    deferred: true
  });


  let show = self.channel.subscribe("activity.show", data => {
    let model = self.activitiesViewModel.getActivityModel({
      _id: data.id
    });
    if (model) {
      self.model(model);
      getUser(model.get("organizer_id"));
    } else {
      data.getActivityModel((err, _model) => {
        if (err) return data.callback(err);
        self.model(_model);
        getUser(_model.get("organizer_id"));
      });
    }
  });
  let getUser = (id) => {
    self.channel.publish("fetch.user", {
      query: {
        _id: id
      },
      callback(err, _user_model) {
        self.user_model(_user_model);
        self.user_activities(getUserActivities());
      }
    });
  };

  let getUserActivities = () => {
    let related_activities = [], user_activity, current, activity_ids;
    activity_ids = self.user_model().get("activities").slice();
    current = activity_ids.indexOf(self.model().id);
    activity_ids.unshift((activity_ids).splice(current, 1)[0]);
    for (let i = 0, l = activity_ids.length; i < l; i++) {
      user_activity = self.activitiesViewModel.getActivityModel({
        _id: activity_ids[i]
      })
      if (user_activity) related_activities.push(user_activity);
    }
    return related_activities;
  };

  self.channel.subscribe("activity.create", data => {
    let activityModel = new ActivityModel();
    activityModel.save(data.activity, {
      wait: true,
      success(model, response) {
        data.callback(null, model);
      },
      error(model, response) {
        data.callback(response);
      }
    });
  });

  self.channel.subscribe("activity.update", data => {
    let model = data.model || self.activitiesViewModel.getActivityModel({
      _id: data._id
    });
    if (!model) {
      if (data.callback) data.callback(`Could not find activity: ${data._id}`);
      return;
    }
    model.save(null, {
      data: {
        update: data.update,
        col: "activities"
      },
      processData: true,
      success(_model, response) {
        model.set(data.attributes);
        if (data.callback) data.callback(null, model);
      },
      error(err) {
        if (data.callback) data.callback(err);
      }
    });
  });

  self.channel.subscribe("activity.remove", data => {
    let model = data.model || self.activitiesViewModel.getActivityModel({
      _id: data._id
    });
    self.activitiesViewModel.activityRemoved(model, model.id);
    model.destroy({
      data: {
        col: "activities"
      },
      processData: true,
      success(model, response) {
        self.channel.publish("remove.user.activity", {
          _id: data.organizer_id,
          user_model: data.user_model || null,
          activity_id: model.id,
          callback: data.callback
        });
      },
      error(err) {
        if (data.callback) {
          data.callback(err);
        }
      }
    });
  });
};

export default ViewModel;