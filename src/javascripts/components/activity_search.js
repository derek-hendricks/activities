import ko from 'knockout';
import _ from 'underscore';

const ActivitySearchComponent = {
  name: 'activity-search',
  viewModel: function (params) {
    var self = this;
    self.channel = params.channel;
    self.search = ko.observable();
    self.suggestions = ko.observableArray([]);
    self.message = ko.observable();

    self.search.subscribe(function(text) {
      var suggestions;
      self.channel.publish('activity.search', {
        attr: 'activity', value: text,
        callback: function(res) {
          self.message('');
          if (res.err) return self.message(res.err);
          suggestions = res.suggestions.concat(self.suggestions());
          suggestions = _.uniq(suggestions, function(suggestion, key, name) { return suggestion.name });
          self.suggestions(suggestions);
        }
      });
    });

    self.setFeature = function(data, event) {
      self.channel.publish('feature.image', data.activity);
      self.message('');
      self.search('');
      self.suggestions([]);
      data.activity.feature = 'true';
      self.channel.publish('feature.activity.set', {activity: data.activity});
    }

   self.search.subscribe(function(value) {
     if (!value) {
       self.suggestions([]);
       self.message('');
     }
   });

  },
  template: '\
    <div class="row">\
      <div class="col-md-6"></div>\
      <div class="col-md-4 activity-search">\
        <div class="row">\
          <div class="col-md-4 activity-search-container">\
            <p data-bind="visible: message">Can\'t find</p>\
            <div class="activity-search-message">\
              <p data-bind="text: message"></p>\
            </div>\
          </div>\
          <div class="col-md-8">\
            <input data-bind="textInput: search" placeholder="search" class="form-control">\
            <div data-bind="visible: suggestions().length > 0, foreach: suggestions" class="activity-search-suggestions">\
              <a data-bind="text: $data.name, click: $parent.setFeature"></a>\
            </div>\
          </div>\
        </div>\
      </div>\
    </div>\
  '
}

module.exports = ActivitySearchComponent;
