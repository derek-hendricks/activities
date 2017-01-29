import ko from "knockout";
import _ from "underscore";

const ImageSearchResultsComponent = {
  name: "image-search-results",
  viewModel(params) {
    const self = this;
    let image_columns = params.columns, image_data;

    self.channel = params.channel;

    self.text = ko.observable();

    self.imageCols = ko.observableArray([]).extend({
      deferred: true
    });
    self.imageData = ko.observable({
      index: 0,
      text: self.text(),
      sets: 0
    }).extend({
      deferred: true
    });
    self.images = ko.observableArray([]).extend({
      deferred: true
    });

    image_data = {
      index: 0,
      text: self.text(),
      sets: 0
    }

    self.channel.subscribe("image_search_results.reset.images", (data) => {
      if (self.images().length >= 1) {
        self.images([]);
        self.imageCols([]);
        self.text("");
        self.imageData(image_data);
      }
    });

    self.viewImages = (data, event, save, callback) => {
      self.imageData(image_data);
      self.channel.publish("image.rows", {
        text: self.text(),
        save: save,
        cols: image_columns,
        callback(err, _images) {
          if (err) {
            self.imageData(image_data);
          }
          if (_images && _images.length >= 1) {
            self.images(_images);
          }
          if (callback) {
            callback(err, {
              text: self.text()
            }, searchResults);
          }
        }
      });

      function searchResults() {
        self.imageData({
          index: 0,
          text: self.text(),
          sets: self.images().length
        });
        self.imageCols(self.images()[0]);
      }
    };

    self.channel.subscribe("image.search", data => {
      self.text(data.text);
      self.viewImages(null, null, data.save, data.callback);
    });

    self.setImage = (data, event) => {
      params.image(data);
    };

    self.setImageSet = (index, data, event) => {
      self.imageData({
        index: index(),
        text: self.text(),
        sets: self.images().length
      });
      self.imageCols(self.images()[self.imageData().index]);
    };

    self.nextImageSet = () => {
      let index = self.imageData().index;
      if (index == self.imageData().sets - 1) index = -1;
      self.imageData({
        index: ++index,
        sets: self.images().length,
        text: self.text()
      });
      self.imageCols(self.images()[self.imageData().index]);
    };

    self.previousImageSet = () => {
      let index = self.imageData().index;
      if (index == 0) index = self.imageData().sets;
      self.imageData({
        index: --index,
        sets: self.images().length,
        text: self.text()
      });
      self.imageCols(self.images()[self.imageData().index]);
    };
  },

  template: `
    <div class="row">
      <div class="col-md-12 image-cols">
        <div class="row message">
          <div class="col-md-8">
            <p data-bind="text: imageData().message"></p>
          </div>
        </div>
        <div class="row">
          <div data-bind="foreach: imageCols">
            <div class="image-col">
              <img data-bind="click: $parent.setImage, attr: {src: $data}"/>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div class="row">
      <div class="col-md-12 image-select">
        <div data-bind="foreach: images">
          <span
            class="image-col-select"
            data-bind=
              "click: function(data,event) { $parent.setImageSet($index, data, event); },
              text: $index() + 1, css: { setselected: $index() == $parent.imageData().index }">
          </span>
        </div>
      </div>
      </div>
      <div class="row">
      <div class="col-xs-4 previous-image">
        <img data-bind="click: previousImageSet"  src="./arrow.png"/>
      </div>
      <div class="col-md-4"></div>
      <div class="col-xs-4 next-image">
        <img data-bind="click: nextImageSet" src="./arrow.png"/>
      </div>
    </div>
  `
}

module.exports = ImageSearchResultsComponent;