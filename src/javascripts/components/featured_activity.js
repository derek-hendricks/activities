import ko from 'knockout';
import _ from 'underscore';

const FeaturedActivity = {
  name: 'featured-activity',
  viewModel: function (params) {
    var self = this;
    self.channel = params.channel;
    self.activityImg = ko.observable();
    self.activityID = ko.observable();
    self.activityTitle = ko.observable();

    params.activities.subscribe(function(_activities) {
      if (!_activities) return;
      self.activityImg(_activities[0].img);
      self.activityID(_activities[0]._id);
      self.activityTitle(_activities[0].activity);
    });

    self.channel.subscribe('feature.image', function(_activity) {
      self.activityImg(_activity.img);
      self.activityID(_activity._id);
      self.activityTitle(_activity.activity);
    });
  },

  template: '\
    <div class="row featured-title-container">\
      <div data-bind="text: activityTitle" class="col-md-12 featured-title"></div>\
    </div>\
    <div class="row">\
      <div class="col-md-12 featured">\
        <a data-bind="attr: {href: \'#activities/\' + activityID()}">\
          <div class="featured-image-container">\
            <img data-bind="attr: {src: activityImg}", data-toggle=\'modal\', data-target=\'#activityModal\'/>\
          </div>\
        </a>\
      </div>\
    </div>\
  '
}

module.exports = FeaturedActivity;
