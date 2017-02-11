import ko from "knockout";
import _ from "underscore";
import utils from "../utils";
import ImageModel from "../models/images";

const ViewModel = function (channel) {
  const self = this;
  let model, imageKeyModel, image_keys;
  self.imageCollection = ko.observable();
  self.images = ko.observableArray([]);

  channel.subscribe("ImageKeys.load", (data) => {
    image_keys = data.response.image_keys;
    imageKeyModel = data.collection.model;
  });

  channel.subscribe("image.search.suggestions", (data) => {
    let search, suggestions = [], index;
    let input = data.text.toLowerCase();
    for (let i = 1, l = image_keys.length; i < l; i++) {
      index = image_keys[i].text.toLowerCase().indexOf(input);
      if (index > -1) {
        suggestions.push({
          text: image_keys[i].text,
          index
        });
      }
    }
    suggestions.sort(utils.indexSort);
    data.callback({suggestions: suggestions, text: data.text});
  });

  function imageRows(image, cols) {
    let rows = [], current = [], urls;
    if ((((urls = image.urls || []) ? urls.length : 0) < 1)) {
      return rows;
    }
    rows.push(current);
    for (let i = 0, l = image.urls.length; i < l; i++) {
      current.push(image.urls[i]);
      if ((i + 1) % cols === 0 && i !== image.urls.length - 1) {
        current = [];
        rows.push(current);
      }
    }
    return rows;
  };

  function fetchImage(params, callback) {
    model = new ImageModel(params);
    model.fetch({
      success(model, result) {
        if (_.has(result, "message")) {
          return callback(result.message);
        }
        self.images.unshift(model.attributes);
        return callback(null, model);
      },
      error(err) {
        callback(err);
      }
    });
  };

  channel.subscribe("image.create", data => {
    createImage(data.text, true, data.callback);
  });

  function createImage(text, data, callback) {
    let model = new ImageModel(), _urls;
    model.save({
      id: text,
      save: data
    }, {
      success(model, response, options) {
        if (response.message && callback) {
          return callback(response.message);
        }
        if (((_urls = model.get("urls") || []) ? _urls.length : 0) < 1) {
          if (callback) {
              return callback({
                message: "Could not find any results"
            });
          }
        }
        self.images.unshift(response);
        if (callback) {
          return callback(null, model);
        }
      },
      error(err) {
        if (callback) {
          return callback({
            message: "Could not find any results"
          });
        }
      }
    });
  };

  channel.subscribe("image.rows", data => {
    let image = self.images().find(_image => _image.text.toLowerCase() === data.text.toLowerCase());
    if (image) {
      return data.callback(null, imageRows(image, data.cols));
    }
    fetchImage({
      text: data.text
    }, (err, model) => {
      if (model) {
        return data.callback(null, imageRows(model.attributes, data.cols));
      }
      createImage(data.text, data.save, (err, model) => {
        if (err) {
          return data.callback(err);
        }
        data.callback(null, imageRows(model.attributes, data.cols));
      });
    });
  });

  self.getImageModel = (query, callback) => {
    if (self.imageCollection()) {
      return self.imageCollection().find(query);
    }
  };

};

export default ViewModel;