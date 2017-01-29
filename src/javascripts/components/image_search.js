import ko from 'knockout';
import _ from 'underscore';

const ImageSearchComponent = {
  name: "image-search",
  viewModel: function (params) {
    const self = this;
    let input = 3;
    let ms = 1000;
    let search = true;

    self.channel = params.channel;

    self.searchInput = ko.observable().extend({
      deferred: true
    });
    self.image_progress = ko.observable().extend({
      deferred: true
    });

    self.channel.subscribe("image_search.reset", function () {
      reset();
    });

    let reset = () => {
      search = true;
      self.searchInput("");
      self.image_progress("");
    };

    let fetch = (_text, _ms, _save) => {
      self.channel.publish("image.search", {
        text: self.searchInput(),
        save: _save,
        callback(err, data, callback) {
          if ((_text || data.text) !== self.searchInput()) {
            setDelay(self.searchInput(), 500, true);
          }
          search = true;
          if (err) {
            self.image_progress(err.message);
            return;
          }
          self.image_progress("");
          callback();
        }
      });
    };

    function setDelay(_text, _ms, _save) {
      new Promise((resolve, reject) => {
        setTimeout(resolve, _ms || ms);
      }).then(() => {
        fetch(_text, _ms, _save);
      });
    }

    self.searchInput.subscribe((data) => {
      self.image_progress(`Searching for ${self.searchInput()}`);
      switch (data) {
        case data.length < input:
          break;
        default:
          if (search) {
            search = !search;
            setDelay(null, null, false);
          }
      }
    });

  },

  template: `
  <div class="search-input">
    <input data-bind="textInput: searchInput" class="form-control" placeholder="image search"/>
    <div>
      <p data-bind="text: image_progress"></p>
    </div>
  </div>
`
}

module.exports = ImageSearchComponent;