define([
  'knockout',
  'underscore'
], function(ko, _) {

  const ImageComponent = {
    vm: function (params) {
      var self = this;
      var channel = params.channel;
      self.imageCols = ko.observableArray([]);
      self.imageData = params.imageData;
      self.images = ko.observableArray([]);

      self.images.subscribe(function(_images) {
        if (_images.length < 1) {
          self.imageCols([]);
          return self.imageData({index: 0, sets: 0, message: 'Click to view images'});
        }
        params.imageData({index: 0, sets: self.images().length, message: ''});
        self.imageCols(self.images()[0]);
      });

      params.channel.subscribe('view.images', function(data) {
        if (data.images) return self.images(data.images);
        if (params.imageData().message === 'Loading...') return;
        params.imageData({index: 0, sets: 0, message: 'Loading...'});
        params.channel.publish('image.rows', {text: data.text, id: data.id, callback: function(err, _images) {
          if (err) return self.imageData({index: 0, sets: 0, message: err.message});;
          self.images(_images);
        }});
      });

      self.setImage = function(data, event) {
        params.image(data);
      };

      self.setImageSet = function(index, data, event) {
        self.imageData({index: index(), sets: self.images().length, message: params.imageData().message});
        self.imageCols(self.images()[self.imageData().index]);
      };

      self.nextImageSet = function() {
        var index = self.imageData().index;
        if (index == self.imageData().sets - 1) return;
        self.imageData({index: ++index, sets: self.images().length, message: params.imageData().message});
        self.imageCols(self.images()[self.imageData().index]);
      };

      self.previousImageSet = function() {
        var index = self.imageData().index;
        if (index == 0) return;
        self.imageData({index: --index, sets: self.images().length,});
        self.imageCols(self.images()[self.imageData().index]);
      };
  },

    template: '\
      <div class="row">\
        <div class="col-md-12 image-cols">\
          <div class="row">\
            <div data-bind="foreach: imageCols">\
              <div class="image-col">\
                <img data-bind="click: $parent.setImage, attr: {src: $data}"/>\
              </div>\
            </div>\
          </div>\
        </div>\
        </div>\
        <div class="row">\
        <div data-bind="visible: imageCols().length > 0" class="col-md-12 image-select">\
          <div data-bind="foreach: images">\
            <span class="image-col-select" data-bind="click: function(data,event){$parent.setImageSet($index,data,event);}, text: $index() + 1, css: {setselected: $index() == $parent.imageData().index}"></span>\
          </div>\
        </div>\
        </div>\
        <div data-bind="visible: imageCols().length > 0" class="row">\
        <div class="col-md-4 previous-image">\
          <img data-bind="click: previousImageSet"  src="./arrow.png"/>\
        </div>\
        <div class="col-md-4"></div>\
        <div class="col-md-4 next-image">\
          <img data-bind="click: nextImageSet" src="./arrow.png"/>\
        </div>\
      </div>\
    '
  }
  return ImageComponent;
});