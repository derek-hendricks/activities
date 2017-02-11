import ko from 'knockout';

const ImageSearchComponent = {
  name: "image-search",
  viewModel: function (params) {
    const self = this;
    self.channel = params.channel;
    self.searchInput = ko.observable();
    self.image_progress = ko.observable().extend({
      deferred: true
    });

    self.delayedInputValue = ko.pureComputed(self.searchInput).extend({
      rateLimit: {
        method: "notifyWhenChangesStop",
        timeout: 400
      }
    });

    self.channel.subscribe("image_search.reset", () => {
      reset();
    });

    function reset() {
      self.searchInput("");
      self.image_progress("");
    }

    function fetchImages() {
      self.channel.publish("image.search", {
        text: self.searchInput(),
        save: true,
        callback(err, data, callback) {
          if (err) {
            self.image_progress(err.message);

            return;
          }
          self.image_progress("");
          callback();
        }
      });
    }

    self.delayedInputValue.subscribe(() => {
      self.image_progress(`Searching for ${self.searchInput()}`);
      fetchImages();
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

export default ImageSearchComponent;