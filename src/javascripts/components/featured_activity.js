import ko from 'knockout';
import _ from 'underscore';

const FeaturedActivity = {
  name: 'featured-activity',
  viewModel: function (params) {
    var self = this;
    self.channel = params.channel;

  },

  template: '\
    <div class="row">\
      <div class="col-md-12">\
        Featued activity goes here\
      </div>\
    </div>\
  '
}

module.exports = FeaturedActivity;
