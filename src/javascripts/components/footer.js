import ko from "knockout";
import _ from "underscore";

const FooterComponent = {
  name: "page-footer",
  viewModel(params) {
    const self = this;
    self.channel = params.channel;
    self.activities = ko.observableArray([]);
    self.activity_settings = ko.observable({}).extend({
      deferred: true
    });

    params.activities.subscribe(activities => {
      if (!activities) return;
      self.activities(activities);
    });

    self.activitiesInfo = () => {
      self.activity_settings(Object.assign(
        self.activity_settings(), {
          active: !!!self.activity_settings().active,
          stats: false,
          manage: true
        }
      ));
      return true;
    };

    self.manageActivities = () => {
      if (self.activity_settings().manage) return;
      self.activity_settings(Object.assign(self.activity_settings(), {
        manage: true,
        stats: false
      }));
      return true;
    };

    self.viewActivityStats = () => {
      if (self.activity_settings().stats) return;
      self.activity_settings(Object.assign(self.activity_settings(), {
        stats: true,
        manage: false
      }));
      return true;
    };

    self.channel.subscribe("activities.manage.nav.settings", data => {
      self.activity_settings(Object.assign(self.activity_settings(), data));
    });

    // TODO: move to activities_manage component
    self.removeAll = (data, event) => {
      self.channel.publish("activities.manage.remove.all", {
        event,
        callback(data) {
          self.activity_settings(Object.assign(self.activity_settings(), data));
        }
      });
    };

  },
  template: `
      <nav class="navbar navbar-inverse navbar-fixed-bottom">
        <div class="container-fluid">
          <div class="navbar-header">
            <a class="navbar-brand" href="/">
              <img alt='Brand' height='20' width='20' src='./clipboard.png'/>
            </a>
          </div>
          <ul class="nav navbar-nav">
            <li class="activate-settings" data-bind="css: {active: activity_settings().active}">
              <a data-bind="click: activitiesInfo" href="/#settings">Activities</a>
            </li>
            <li><a>Users</a></li>
          </ul>
          <ul class="nav navbar-nav pull-right">
            <li><a>About</a></li>
            <li><a>Contact</a></li>
          </ul>
        </div>

        <div class="container settings">
          <div id="settings" class="row">
            <div class="col-md-12 setting-headers" data-bind="visible: activity_settings().active">
              <a href="/#settings" data-bind="click: manageActivities, css: {activeSetting: activity_settings().manage}">Manage Activities</a>
              <a data-bind="click: viewActivityStats, css: {activeSetting: activity_settings().stats}">View Stats</a>
              <button
                data-bind="click: removeAll,
                event: {contextmenu: removeAll},
                contextmenuBubble: false,
                css: {
                  removeAll: activity_settings().delete,
                  confirm: activity_settings().delete_confirm > 1
                }"
                class="close" type="button">
                  <span>Delete All</span>
              </button>
            </div>
          </div>
        </div>

        <div class="container activity-settings" id="activity-settings">
          <activities-manage params="channel: channel, activities: activities, activity_settings: activity_settings"></activities-manage>
        </div>

        </div>
      </nav>
  `
}

module.exports = FooterComponent;