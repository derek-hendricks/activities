import ko from 'knockout';
import _ from 'underscore';
import ImageModel from '../models/images';

const ViewModel = function (channel) {
	var self = this, model;
	self.imageCollection = ko.observable();
	self.images = ko.observableArray([]);

	var imageRows = function(image, cols) {
		var rows = [], current = [], urls;
		if ((((urls = image.urls || []) ? urls.length : 0) < 1)) return rows;
		rows.push(current);
		for (var i = 0, l = image.urls.length; i < l; i++)  {
			current.push(image.urls[i]);
			if ((i + 1) % cols === 0 && i !== image.urls.length - 1) {
				current = [];
				rows.push(current);
			}
		}
		return rows;
	};

	var fetchImage = function(params, callback) {
		model = new ImageModel(params);
		model.fetch({success: function(model, result) {
			if (_.has(result, 'message')) return callback(result.message);
			self.images.unshift(model.attributes);
			return callback(null, model);
		}, error: function(err) {
			return callback(err);
		}});
	};

	channel.subscribe('image.create', function(data) {
		createImage(data.text, true, data.callback);
	});

	var createImage = function(text, data, callback) {
		var model = new ImageModel(), _urls;
		model.save({id: text, save: data}, { success: function(model, response, options) {
			if (response.message && callback) return callback(response.message);
			if (((_urls = model.get('urls') || []) ? _urls.length : 0) < 1)  {
				if (callback) return callback({message: 'There doesn\'t seem to be any matches for \'' + text + '\''});
			}
			self.images.unshift(response);
			if (callback) return callback(null, model);
		}, error: function(err) {
			if (callback) return callback({message: 'Could not find any results'});
		}
		});
	};

	channel.subscribe('image.rows', function(data) {
		var image = self.images().find(function(_image) {
			return _image.text.toLowerCase() === data.text.toLowerCase();
		});
		if (image) return data.callback(null, imageRows(image, data.cols));
		fetchImage({text: data.text}, function(err, model) {
			if (model) return data.callback(null, imageRows(model.attributes, data.cols));
			createImage(data.text, data.save, function(err, model) {
				if (err) return data.callback(err);
				data.callback(null, imageRows(model.attributes, data.cols));
			});
		});
	});

	self.getImageModel = function(query, callback) {
		if (self.imageCollection()) {
			var image = self.imageCollection().find(query);
			return image;
		}
	};

};

module.exports = ViewModel;
