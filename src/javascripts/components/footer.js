import ko from 'knockout';
import _ from 'underscore';

const FooterComponent = {
  name: 'page-footer',
  viewModel: function (params) {
    var self = this, click = {count: 0, all: 0, id: null};
    self.channel = params.channel;
    self.activities = ko.observableArray([]);
    self.activityPages = ko.observableArray([]);
    self.page_index = ko.observable(0);
    self.activity_settings = ko.observable({active: false, manage: false, stats: false, delete: false});
    self.activity_move = ko.observable({});

    params.activities.subscribe(function(activities) {
      if (!activities) return;
      self.activities(activities);
      if (self.activity_settings().active) {
        activityPages(6, 24);
      }
    });

    var mEventReset = function(e) {
      switch (e) {
        case 'move':
          resetClick();
          break;
        case 'click':
          self.activity_move({});
          break;
        case 'delete':
          click.all = 0;
          self.activity_move({});
          break;
        case 'all':
          self.activity_move({});
          resetClick();
          break;
        default:
          click = {count: 0, all: 0};
          self.activity_move({});
          break;
      }
    }

    var resetClick = function() {
      click = {count: 0, all: 0};
      self.activity_settings(Object.assign(self.activity_settings(), {delete: false, delete_one: false}));
    }

    var activityPages = function(cols, page_num) {
      var rows = [], current = [], pages = [], ref;
      rows.push(current);
      for (var i = 0, l = self.activities().length; i < l; i++)  {
        ref = i + 1;
        current.push(self.activities()[i]);
        if (((ref) % cols) === 0 && ((ref) % page_num) !== 0) {
          current = [];
          rows.push(current);
        }
        if (((ref) % page_num) === 0 && i !== self.activities().length - 1) {
            pages.push(rows);
            rows = [];
            current = [];
            rows.push(current);
          }
      }
      if (rows.length) pages.push(rows);
      self.activityPages(pages);
   }

    self.setPage = function(index, data, event) {
      self.page_index(index());
    }

    self.activitiesInfo = function() {
      activityPages(6, 24);
      var setting = Object.assign(self.activity_settings(), {active: true});
      self.activity_settings(setting);
      mEventReset();
      return true;
    }

    self.manageActivities = function() {
      if (self.activityPages().length < 1) return;
      var setting = Object.assign(self.activity_settings(), {manage: true});
      self.activity_settings(setting);
      return true;
    }

    self.viewActivityStats = function() {
      var setting = Object.assign(self.activity_settings(), {stats: true});
      self.activity_settings(setting);
      return true;
    }

    var moveActivity = function(ac_x, ac_y) {
      var attributes, query, queue = d3.queue(1);
      for (var i = 0, l = arguments.length; i < l; i++) {
        (function(_i, _arguments) {
          queue.defer(updateActivity, _arguments[_i]);
        })(i, arguments);
      }
      queue.await(function(err) {
        // TODO: success and error notification
      });
      function updateActivity(activity, callback) {
        attributes = {priority: activity.priority, feature: activity.feature};
        query = {$set: attributes};
        self.channel.publish('activity.update', {
          _id: activity._id, attributes: attributes, query: query,
          callback: function(err, model) {
            callback(err);
          }
        });
      }
    }

    self.removeActivity = function(data, event) {
      var count = click.count + 1;
      if (event.type === 'contextmenu') {
        mEventReset('all');
        return;
      }
      mEventReset('delete');
      if (click._id !== data._id) {
        click = Object.assign(click, {count: 1, _id: data._id});
        self.activity_settings(Object.assign(self.activity_settings(), {delete_one: true}));
        return;
      }
      click = Object.assign(click, {count: count});
      if (click.count < 2) return;
      self.channel.publish('activity.remove', data);
      mEventReset('all');
    };

    self.removeAll = function(data, event) {
      if (event.type === 'contextmenu') {
        mEventReset('all');
        return;
      }
      ++click.all;
      mEventReset('click');
      self.activity_settings(Object.assign(self.activity_settings(), {delete: true}));
      if (click.all > 2) {
        self.channel.publish('delete.all', {callback: function(res) {
          // TODO: failure and success notification
          // self.message(res.err || 'success');
        }});
        mEventReset('all');
      }
    }

    self.toggleMoveActivity = function(data) {
      var ac_x, ac_y;
       switch (self.activity_move()._id) {
        case data._id:
          mEventReset();
          break;
        case undefined:
          mEventReset('move');
          self.activity_move(data);
          break;
        default:
          ac_x = {_id: data._id, priority: self.activity_move().priority, feature: self.activity_move().feature};
          ac_y = {_id: self.activity_move()._id, priority: data.priority, feature: data.feature};
          self.channel.publish('activities.modified', {activities: [ac_x, ac_y]});
          moveActivity(ac_x, ac_y);
          mEventReset('all');
          break;
      }
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
        \
        \
        <div class="container settings">\
          <div id="settings" class="row">\
            <div class="col-md-12 setting-headers" data-bind="visible: activity_settings().active">\
              <a href="/#settings" data-bind="click: manageActivities, css: {activeSetting: activity_settings().manage}">Manage Activities</a>\
              <a data-bind="click: viewActivityStats, css: {activeSetting: activity_settings().stats}">View Stats</a>\
              <button data-bind="click: removeAll, event: {contextmenu: removeAll}, contextmenuBubble: false, visible: activity_settings().manage, css: {removeAll: activity_settings().delete}" class="close" type="button">\
                <span>Delete All</span>\
              </button>\
            </div>\
          </div>\
        </div>\
        \
        \
        <div class="container activity-settings" id="activity-settings">\
          <div class="row">\
            <div class="col-md-10 activity-settings-col">\
              <div data-bind="visible: activity_settings().manage">\
                <div class="row activity-rows" data-bind=\'foreach: activityPages()[page_index()]\'>\
                  <div class="row" data-bind=\'foreach: $data\'>\
                    <div class="col-xs-1 m-activity-display" data-bind="click: !$parents[1].activity_move()._id ? null : function(event){$parents[1].toggleMoveActivity($data);}, css: {activitySelected: $parents[1].activity_move()._id === $data._id, activityMove: $parents[1].activity_move()._id}">\
                      <div class="row">\
                        <div class="col-xs-9 title-setting">\
                          <p data-bind="text: $data.activity"></p>\
                        </div>\
                        <div class="col-xs-3 delete-activity-setting">\
                          <button data-bind="css: {deleteActive: $parents[1].activity_settings().delete_one}" type="button" class="close" aria-label="Close">\
                            <span data-bind="click: function(event){$parents[1].removeActivity($data, event);}, event: {contextmenu: $parents[1].removeActivity}, clickBubble: false" aria-hidden="true">×</span>\
                          </button>\
                        </div>\
                      </div>\
                      <div class="row update-activity-setting">\
                        <div class="col-xs-2">\
                          <span data-bind="click: function(event){$parents[1].toggleMoveActivity($data);}, clickBubble: false, css: {glyphiconMove: $parents[1].activity_move()._id, glyphiconSelected: $parents[1].activity_move()._id === $data._id}" class="glyphicon glyphicon-move"></span>\
                        </div>\
                      </div>\
                    </div>\
                  </div>\
                </div>\
                <div data-bind="visible: activityPages().length > 1" class="row activity-settings-pagination">\
                  <div class="col-xs-12">\
                    <span>Pages: </span>\
                    <span data-bind="foreach: activityPages" class="activity-pages">\
                      <a href="/#settings" data-bind="click: function(index, data, event){$parent.setPage($index, data, event); return true;}, text: $index() + 1, css: {pageSelected: $index() === $parent.page_index()}"></a>\
                    </span>\
                  </div>\
                </div>\
              </div>\
            </div>\
          </div>\
          \
          \
        </div>\
      </nav>\
  '
}

module.exports = FooterComponent;

