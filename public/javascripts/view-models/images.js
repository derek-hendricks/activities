define([
	'knockout',
	'underscore',
	'image_model'
], function (ko, _, ImageModel) {

	const ViewModel = function (channel) {
		var self = this, model;
		self.imageCollection = ko.observable();
    self.images = ko.observableArray([]);

		var imageRows = function(image) {
			var rows = [], current = [];
			rows.push(current);
			for (var i = 0; i < image.urls.length; i += 1) {
				current.push(image.urls[i]);
				if ((i + 1) % 5 === 0 && i != image.urls.length - 1) {
					current = [];
					rows.push(current);
				}
			}
			return rows;
    };

		var fetchImage = function(params, callback) {
			model = new ImageModel(params);
			model.fetch({success: function(model, result) {
				if (!result) return callback(new Error('No image urls'));
			  return callback(null, model);
			}, error: function(err) {
			  return callback(err);
			}});
		};

		var createImage = function(activity_id, activity, callback) {
			var model = new ImageModel();
			model.save({activity_id: activity_id, text: activity, urls: []}, {
				wait: true,
				success: function(model, response, options) {
					self.images.unshift(response);
					return callback(null, model);
				}, error: function(response) {
					return callback(response.responseText);
				}
		  });
		};

    channel.subscribe('image.rows', function(data) {
		  var image = self.images().find(function(_image) {
				return _image.activity_id === data.id;
			});
			if ((typeof image !== "undefined" && image !== null ? image.urls.length : void 0) > 0) {
				if (image.text.toLowerCase() === data.activity.toLowerCase()) return data.callback(null, imageRows(image));
				return fetchImage({_id: data.id, text: data.activity}, function(err, model) {
					if (model) return data.callback(null, imageRows(model.attributes));
					createImage(data.id, data.activity, function(err, model) {
						if (err) return data.callback(err);
            return data.callback(null, imageRows(model.attributes));
					});
				});
      } else {
				fetchImage({_id: data.id, text: data.activity}, function(err, model) {
					if (model) return data.callback(null, imageRows(model.attributes));
					createImage(data.id, data.activity, function(err, model) {
						if (err) return data.callback(err);
						return data.callback(null, imageRows(model.attributes));
					});
				});
			}
    });

		self.getImageModel = function(query, callback) {
			if (self.imageCollection()) {
				var image = self.imageCollection().find(query);
				return image;
			}
		};

	};

	return ViewModel;
});