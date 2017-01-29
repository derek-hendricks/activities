import ko from "knockout";
import _ from "underscore";
import utils from "../utils";

const ViewModel = function(channel) {
  const self = this;
  let collection;
  let model;
  let categories;
  self.channel = channel;

  self.channel.subscribe("categories.load", (data) => {
    categories = data.response.categories;
    collection = data.collection;
    model = collection.model;
  });

  self.channel.subscribe("get.categories", (data) => {
    data.callback({categories});
  });

  self.channel.subscribe("categories.create", (data) => {

  });
};

module.exports = ViewModel;
