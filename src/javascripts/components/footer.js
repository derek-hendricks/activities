import ko from 'knockout';
import _ from 'underscore';

const FooterComponent = {
  name: 'page-footer',
  viewModel: function (params) {
    var self = this;
    self.channel = params.channel;
    self.activities = ko.observableArray([]);
    self.activityPages = ko.observableArray([]);
    self.page_index = ko.observable(0);
    self.activity_settings = ko.observable({active: false, manage: false, stats: false, delete: false});

    params.activities.subscribe(function(activities) {
      if (!activities) return;
      self.activities(activities);
      activityPages(activities, 6, 24);
    });

    self.deleteAll = function() {
      // TODO: activities deletion confirm message
      self.activity_settings({active: true, manage: false, stats: false, delete: true});
      self.channel.publish('delete.all', {callback: function(res) {
        // TODO: failure and success notifications
      }});
    }

    self.setPage = function(index, data, event) {
      self.page_index(index());
    }

    self.activitiesInfo = function() {
      self.activity_settings({active: true, manage: false, stats: false, delete: false});
      return true;
    }

    var activityPages = function(activities, cols, page_num) {
      var rows = [], current = [], pages = [], ref;
      rows.push(current);
      for (var i = 0; i < activities.length; i++) {
        ref = i + 1;
        current.push(activities[i]);
        if (((ref) % cols) === 0 && ((ref) % page_num) !== 0) {
          current = [];
          rows.push(current);
        }
        if (((ref) % page_num) === 0 && i !== activities.length - 1) {
            pages.push(rows);
            rows = [];
            current = [];
            rows.push(current);
          }
      }
      if (rows.length) pages.push(rows);
      self.activityPages(pages);
   }

    self.manageActivities = function() {
      if (self.activityPages().length < 1) return;
      self.activity_settings({active: true, manage: true, stats: false, delete: false});
    }

    self.viewActivityStats = function() {
      self.activity_settings({active: true, manage: false, stats: true, delete: false});
    }
  },
  template: '\
      <nav class="navbar navbar-inverse navbar-fixed-bottom">\
        <div class="container-fluid">\
          <div class="navbar-header">\
            <a class="navbar-brand" href="/">\
              <img alt=\'Brand\' height=\'20\' width=\'20\' src=\'./clipboard.png\'/>\
            </a>\
          </div>\
          <ul class="nav navbar-nav">\
            <li data-bind="css: {active: activity_settings().active}">\
              <a data-bind="click: activitiesInfo" href="/#settings">Activities</a>\
            </li>\
            <li><a>Users</a></li>\
          </ul>\
          <ul class="nav navbar-nav pull-right">\
            <li><a>About</a></li>\
            <li><a>Contact</a></li>\
          </ul>\
        </div>\
        <div id="settings" class="row settings">\
          <div class="col-md-3" data-bind="visible: activity_settings().active">\
            <ul>\
              <li><a data-bind="click: manageActivities, css: {activeSetting: activity_settings().manage}">Manage Activities</a></li>\
              <li><a data-bind="click: viewActivityStats, css: {activeSetting: activity_settings().stats}">View Stats</a></li>\
              <li><a data-bind="click: deleteAll, css: {activeSetting: activity_settings().delete}">Delete All Activities</a></li>\
            </ul>\
          </div>\
          <div class="col-md-8">\
            <div data-bind="visible: activity_settings().manage" class="manage-activity-settings">\
              <div class="row activity-rows" data-bind=\'foreach: activityPages()[page_index()]\'>\
                <div class="row" data-bind=\'foreach: $data\'>\
                  <div class="col-xs-2 m-activity-display">\
                    <p data-bind="text: $data.activity"></p>\
                  </div>\
                </div>\
              </div>\
              <div data-bind="visible: activityPages().length > 1" class="row activity-settings-pagination">\
                <div class="col-xs-12">\
                  <span>Pages: </span>\
                  <span data-bind="foreach: activityPages">\
                    <span data-bind="click: function(data, event){$parent.setPage($index, data, event);},text: $index() + 1">\
                    </span>\
                  </span>\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>\
      </nav>\
  '
}

module.exports = FooterComponent;
