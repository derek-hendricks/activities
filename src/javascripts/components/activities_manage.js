import ko from "knockout";
import _ from "underscore";

const ActivitiesManage = {
  name: "activities-manage",
  viewModel(params) {
    const self = this;

    let page_data = {
      cols: 6,
      num: 24
    };
    let items = [];
    let click = {
      count: 0,
      all: 0,
      id: null
    };
    let sortActivities, activityPages, mEventReset, resetClick, updateActivities;

    self.channel = params.channel;
    self.activities = ko.observableArray([]);
    self.page_index = ko.observable(0);
    self.activityPages = ko.observableArray([]).extend({
      deferred: true
    });
    self.activity_settings = ko.observable({}).extend({
      deferred: true
    });
    self.activity_move = ko.observable({}).extend({
      deferred: true
    });
    self.items = ko.observableArray([]).extend({
      deferred: true
    });

    params.activities.subscribe(activities => {
      if (!activities) return;
      self.activities(activities);
      if (self.activity_settings().active) {
        activityPages(page_data.cols, page_data.num);
      }
    });

    params.activity_settings.subscribe(settings => {
      if (!settings) return;
      self.activity_settings(settings);
      if (settings.active && !settings.active_toggled) {
        activityPages(page_data.cols, page_data.num);
        self.activity_settings(Object.assign(self.activity_settings(), {
          active_toggled: true
        }));
        return true;
      }
    });

    function toDraggables(values) {
      return ko.utils.arrayMap(values, value => ({
        value,
        dragging: ko.observable(false),
        isSelected: ko.observable(false)
      }));
    }

    activityPages = (cols, page_num) => {
      let rows = [], current = [], pages = [], ref;
      self.items(toDraggables(self.activities().slice()));
      rows.push(current);
      for (let i = 0, l = self.items().length; i < l; i++) {
        ref = i + 1;
        current.push(self.items()[i]);
        if ((ref % cols) === 0 && (ref % page_num) !== 0) {
          current = [];
          rows.push(current);
        }
        if ((ref % page_num) === 0 && i !== self.items().length - 1) {
          pages.push(rows);
          rows = [];
          current = [];
          rows.push(current);
        }
      }
      if (rows.length) pages.push(rows);
      self.activityPages(pages);
    }

    mEventReset = e => {
      switch (e) {
        case "move":
          resetClick();
          break;
        case "click":
          self.activity_move({});
          break;
        case "delete":
          click.count = 0;
          self.activity_settings(Object.assign(self.activity_settings(), {
            delete_one: false
          }));
          self.activity_move({});
          break;
        case "all":
          self.activity_move({});
          resetClick();
          break;
        case "settings":
          self.activity_settings({});
          self.activity_move({});
          break;
        default:
          click = {
            count: 0,
            all: 0
          };
          self.activity_move({});
          break;
      }
    }

    resetClick = () => {
      click = {
        count: 0,
        all: 0
      };
      self.channel.publish("activities.manage.nav.settings", {
        delete: false,
        delete_confirm: 0
      });
      self.activity_settings(Object.assign(self.activity_settings(), {
        delete_one: false
      }));
    }

    self.setPage = (index, data, event) => {
      self.page_index(index());
    }

    updateActivities = activities => {
      let attributes;
      let query;
      let queue = d3.queue(1);
      for (let i = 0, l = activities.length; i < l; i++) {
        (((_i, _activities) => {
          queue.defer(updateActivity, _activities[_i]);
        }))(i, activities);
      }
      queue.await(err => {
        // TODO: success and error notification
      });

      function updateActivity(activity, callback) {
        attributes = {
          priority: activity.priority,
          feature: activity.feature
        };
        query = {
          $set: attributes
        };
        self.channel.publish("activity.update", {
          _id: activity._id,
          attributes,
          query,
          callback(err, model) {
            callback(err);
          }
        });
      }
    }

    self.removeActivity = (data, event) => {
      let count = click.count + 1;
      if (event.type === "contextmenu") {
        mEventReset("all");
        return;
      }
      mEventReset("delete");
      if (click._id !== data._id) {
        click = Object.assign(click, {
          count: 1,
          _id: data._id
        });
        self.activity_settings(Object.assign(self.activity_settings(), {
          delete_one: data._id
        }));
        return;
      }
      click = Object.assign(click, {
        count
      });
      if (click.count < 2) return;
      self.channel.publish("activity.remove", data);
      mEventReset("all");
    };

    self.channel.subscribe("activities.manage.remove.all", data => {
      if (data.event.type === "contextmenu") {
        data.callback({
          delete: false,
          delete_confirm: 0
        });
        return mEventReset("all");
      }
      ++click.all;
      mEventReset("delete");
      data.callback({
        delete: true,
        delete_confirm: click.all
      });
      if (click.all > 2) {
        self.channel.publish("delete.all", {});
        data.callback({
          delete: false,
          delete_confirm: 0
        });
        mEventReset("all");
      }
    });

    self.toggleMoveActivity = data => {
      let ac_x;
      let ac_y;
      switch (self.activity_move()._id) {
        case data._id:
          mEventReset();
          break;
        case undefined:
          mEventReset("move");
          self.activity_move(data);
          break;
        default:
          ac_x = {
            _id: data._id,
            priority: self.activity_move().priority,
            feature: self.activity_move().feature
          };
          ac_y = {
            _id: self.activity_move()._id,
            priority: data.priority,
            feature: data.feature
          };
          self.channel.publish("activities.modified", {
            activities: [ac_x, ac_y]
          });
          updateActivities([ac_x, ac_y]);
          mEventReset("all");
          break;
      }
    };

    self.reorder = (event, dragData, zoneData) => {
      self.activity_move(zoneData.item.value);
    };

    self.resort = (event, dragData, zoneData, row_i, col_i) => {
      self.activity_move({
        sort: zoneData.item,
        sort_id: zoneData.item[0].value._id,
        sort_row_i: row_i,
        sort_col_i: col_i
      });
    };

    self.dragStart = item => {
      item.dragging(true);
      self.activity_move({
        _id: item.value._id
      });
    };

    sortActivities = (item, row_i, col_i) => {
      let i_y, i_x, activities, start, end, ref, moved, priority, feature;
      i_x = self.page_index() * page_data.num + self.activity_move().sort[1] * page_data.cols + self.activity_move().sort[2];
      i_y = self.page_index() * page_data.num + row_i * page_data.cols + col_i;
      start = Math.min(i_x, i_y);
      end = i_y > i_x ? i_y + 1 : i_x;
      if (start === end) return mEventReset("all");
      activities = self.activities().slice(start, end);

      if (i_y > i_x) {
        activities.unshift(activities.splice(activities.length - 1, 1)[0]);
        moved = activities[0];
      } else {
        activities.push(activities.splice(0, 1)[0]);
        moved = activities[activities.length - 1];
      }

      for (let i = 0, l = activities.length; i < l; i++) {
        if (i_y > i_x) {
          priority = (ref = activities[i + 1]) ? ref.priority : moved.priority;
          feature = (ref = activities[i + 1]) ? ref.feature : moved.feature;
        } else {
          priority = (ref = activities[i - 1]) ? ref.previous_priority : moved.priority;
          feature = (ref = activities[i - 1]) ? ref.previous_feature : moved.feature;
        }

        activities[i] = {
          _id: activities[i]._id,
          previous_priority: activities[i].priority,
          priority,
          previous_feature: activities[i].feature,
          feature
        };
      }
      mEventReset("all");
      self.channel.publish("activities.modified", {
        activities
      });
      updateActivities(activities);
    }

    self.dragEnd = (item, row_i, col_i) => {
      let ac_x;
      let ac_y;
      item.dragging(false);
      if (self.activity_move().sort) return sortActivities(item, row_i, col_i);
      if (self.activity_move()._id === item.value._id) return mEventReset("all");
      ac_x = {
        _id: self.activity_move()._id,
        priority: item.value.priority,
        feature: item.value.feature
      };
      ac_y = {
        _id: item.value._id,
        priority: self.activity_move().priority,
        feature: self.activity_move().feature
      };
      self.channel.publish("activities.modified", {
        activities: [ac_x, ac_y]
      });
      updateActivities([ac_x, ac_y]);
      mEventReset("all");
    };
  },

  template: `
    <div class="container manage-settings" data-bind="css: {activitiesManage: activity_settings().manage && activity_settings().active}">

      <div class="row">
        <div class="col-md-4">
          <categories params="channel: channel, activity_settings: activity_settings"></categories>
        </div>
        <div class="col-md-8 manage-settings-col">

            <div class="row activity-rows" data-bind='foreach: activityPages()[page_index()]'>
              <div class="row m-activity-row" data-bind='foreach: $data'>
                <div class="col-xs-1 m-activity-display"
                  data-bind="click: !$parents[1].activity_move()._id ? null : function(event){$parents[1].toggleMoveActivity($data.value);},
                  css: {dragging: dragging,
                  activitySelected: $parents[1].activity_move()._id === $data.value._id,
                  activityMove: $parents[1].activity_move()._id},
                  dragZone: {name: 'sortable',
                  dragStart: $parents[1].dragStart,
                  dragEnd: function(event){$parents[1].dragEnd($data, $parentContext.$index(), $index());}},
                  dragEvents: {accepts: 'sortable', dragOver: $parents[1].reorder,
                  data: {items: $parents[1].items(), item: $data}}">

                    <div class="row">
                      <span
                        data-bind="dragZone: { name: 'sortable'},
                        dragEvents: {accepts: 'sortable',
                        dragOver: function(event, dragData, zoneData){$parents[1].resort(event, dragData, zoneData, $parentContext.$index(), $index());},
                        data: {items: $parents[1].items(),
                        item: [$data, $parentContext.$index(), $index()]}},
                        css: {first: $index() === 0,
                        sortSelected: $parents[1].activity_move().sort_row_i == $parentContext.$index() && $parents[1].activity_move().sort_col_i == 0 && $index() === 0}"
                        class="sort-area i">
                      </span>
                      <span
                        data-bind="dragZone: { name: 'sortable'},
                        dragEvents: {accepts: 'sortable',
                        dragOver: $parents[1].resort,
                        data: {items: $parents[1].items(),
                        item: [$data, $parentContext.$index(), $index() + 1]}},
                        attr: {data: $data, index: $index()},
                        css: {sortSelected: $parents[1].activity_move().sort_id === $data.value._id,
                        hideSort: $parents[1].activity_move().sort_row_i == $parentContext.$index() && $parents[1].activity_move().sort_col_i == 0 && $index() === 0}"
                        class="sort-area">
                      </span>
                      <div class="col-xs-9 title-setting">
                        <p data-bind="text: $data.value.activity"></p>
                      </div>
                      <div class="col-xs-3 delete-activity-setting">
                        <button
                          data-bind="css: {deleteActive: $parents[1].activity_settings().delete_one == $data.value._id}"
                          type="button" class="close" aria-label="Close">
                            <span data-bind="click: function(event){$parents[1].removeActivity($data.value, event);},
                              event: {contextmenu: $parents[1].removeActivity},
                              clickBubble: false" aria-hidden="true">×
                            </span>
                        </button>
                      </div>
                    </div>
                    <div class="row update-activity-setting">
                      <div class="col-xs-2">
                        <span
                          data-bind="click: function(event){$parents[1].toggleMoveActivity($data.value);},
                          clickBubble: false,
                          css: {
                            glyphiconMove: $parents[1].activity_move()._id,
                            glyphiconSelected: $parents[1].activity_move()._id === $data.value._id,
                            deleteConfirm: $parents[1].activity_settings().delete_confirm > 1
                          }"
                          class="glyphicon glyphicon-move"
                        ></span>
                      </div>
                    </div>

                </div>
              </div>
            </div>
            <div data-bind="visible: activityPages().length > 1" class="row activity-settings-pagination">
              <div class="col-xs-12">
                <span>Pages: </span>
                <span data-bind="foreach: activityPages" class="activity-pages">
                  <a href="/#settings"
                    data-bind="click: function(index, data, event){$parent.setPage($index, data, event); return true;},
                    text: $index() + 1,
                    css: {pageSelected: $index() === $parent.page_index()}">
                  </a>
                </span>
              </div>
            </div>

        </div>
      </div>
  `
}

module.exports = ActivitiesManage;
