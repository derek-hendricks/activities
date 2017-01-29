import ko from "knockout";
import _ from "underscore";
import ImageModel from "../models/images";

const ViewModel = function (channel) {
  const self = this;
  let model;
  self.imageCollection = ko.observable();
  self.images = ko.observableArray([]);

  let imageRows = (image, cols) => {
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

  let fetchImage = (params, callback) => {
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

  let createImage = (text, data, callback) => {
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

module.exports = ViewModel;