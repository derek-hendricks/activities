import ko from 'knockout';
import _ from 'underscore';

const ActivitySearchComponent = {
  vm: function (params) {
    var self = this;
    self.channel = params.channel;
    self.search = ko.observable();

    self.search.subscribe(function(text) {
      console.log('search', text);
    });
  },

  template: '\
    <div class="row">\
      <div class="col-md-8"></div>\
      <div class="col-md-2 activity-search">\
        <input data-bind="textInput: search" placeholder="search" class="form-control">\
      </div>\
    </div>\
  '
}

module.exports = ActivitySearchComponent;
