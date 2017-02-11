import ko from "knockout";
import _ from "underscore";
import Utils from "../utils";

const ActivitySearchComponent = {
  name: "activity-search",
  viewModel(params) {
    const self = this;
    let activities = [];
    self.channel = params.channel;
    self.params = params;
    self.search = ko.observable().extend({
      deferred: true
    });
    self.suggestions = ko.observableArray([]).extend({
      deferred: true
    });

    self.SearchResult = {
      show_message: params.error_message,
      err: ko.observable()
    };

    params.activities.subscribe(function(_activities) {
      if (_activities.length) activities = _activities;
    })

    function activitiesSearch(_input, callback) {
      let suggestions = [], input = _input.toLowerCase();
      for (let i = 0, l = activities.length; i < l; i++) {
        let activity = activities[i].activity.toLowerCase();
        let index = activity.indexOf(input);
        if (index > -1 && Object.is(activity[0], input[0])) {
          suggestions.push({
            activity: activities[i],
            name: activities[i].activity,
            index: index,
            length: activities[i].activity.length
          });
        }
      }
      suggestions.sort(Utils.indexSort).sort(Utils.lenSort);
      callback(suggestions[0] ? null : input, suggestions);
    };

    self.search.subscribe(text => {
      activitiesSearch(text, (err, suggestions) => {
          self.SearchResult.err("");
          if (err) {
            if (params.error_message) {
              self.SearchResult.err(`Can't find <br/> ${err}`);
              return self.suggestions([]);
            }
          }
          suggestions = _.uniq(suggestions, (suggestion, key, name) => suggestion.name);
          self.suggestions(suggestions);
      });
    });

    self.selectActivity = (data) => {
      params.onActivitySelect(data);
      self.search("");
      self.suggestions([]);
      if (params.error_message) self.SearchResult.err("");
    }

    self.search.subscribe(value => {
      if (!value) {
        self.suggestions([]);
        self.SearchResult.err("");
      }
    });

  },
  template: `
        <div class="row">
          <div data-bind="with: SearchResult">
            <div data-bind="visible: show_message" class="col-md-4 activity-search-container">
              <p data-bind="html: err"></p>
            </div>
          </div>
          <div class="col-md-8">
            <input data-bind="textInput: search, attr: { placeholder: params.placeholder }" class="form-control" />
            <div data-bind="visible: suggestions().length > 0, foreach: suggestions" class="activity-search-suggestions">
              <div>
                <a data-bind="text: $data.name, click: $parent.selectActivity"></a>
              </div>
            </div>
          </div>
        </div>
  `
}

export default ActivitySearchComponent;