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
			for (var i = 0; i < image.urls.length; i++) {
				current.push(image.urls[i]);
				if ((i + 1) % 5 === 0 && i !== image.urls.length - 1) {
					current = [];
					rows.push(current);
				}
			}
			return rows;
    };

		var fetchImage = function(params, callback) {
			model = new ImageModel(params);
			model.fetch({success: function(model, result) {
				self.images.unshift(model.attributes);
			  return callback(null, model);
			}, error: function(err) {
			  return callback(err);
			}});
		};

		channel.subscribe('image.create', function(data) {
      createImage(data.activity_id, data.text, data.callback);
		});

		var createImage = function(activity_id, text, callback) {
			var model = new ImageModel();
			model.save({activity_id: activity_id, text: text}, {
				success: function(model, response, options) {
					var _urls;
					if (response.error_message) return callback(response.error_message);
					if (((_urls = model.get('urls') || []) ? _urls.length : 0) < 1)  {
					  return callback({message: 'Could not find results for ' + text});
					}
					self.images.unshift(response);
					return callback(null, model);
				}, error: function(err) {
					if (callback) return callback({message: 'Could not find results for ' + text});
				}
		  });
		};

    channel.subscribe('image.rows', function(data) {
		  var ref, image;
			image = self.images().find(function(_image) {
				return _image.text === data.text;
			});
			if (image) {
        if (image.text.toLowerCase() === data.text.toLowerCase()) return data.callback(null, imageRows(image));
			}
			return fetchImage({_id: data.id, text: data.text}, function(err, model) {
				if (model) return data.callback(null, imageRows(model.attributes));
				createImage(data.id, data.text, function(err, model) {
					if (err) return data.callback(err);
					return data.callback(null, imageRows(model.attributes));
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

	return ViewModel;
});


