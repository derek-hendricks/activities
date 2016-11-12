"use strict";

// const ObjectId = require('bson').ObjectId;

// class Activity {
//   constructor(_id, activity, organizer_id, participants, description, img, start_date, created_at) {
//     this._id = _id;
//     this.activity = activity;
//     this.organizer_id = organizer_id;
//     this.participants = participants;
//     this.description = description;
//     this.img = img;
//     this.start_date = start_date;
//     this.created_at = created_at;
//   };

//   static getActivities(db, res, next, callback) {
//     db.collection('activities').find().sort({created_at: -1}).toArray((err, results) => {
//       if (err) return next ? next(err) : callback(err);
//       if (res) return res.json({activities: results});
//       callback(null, {activities: results});
//     });
//   };

//   static removeActivities(db, req, res, next, callback) {
//     var database = req.body.db, query;
//     if (query = req.body.query) {
//       query['_id']['$in'] = query['_id']['$in'].map((id) => { return ObjectId(id) });
//     } else {
//       query = {'_id': ObjectId(req.params.id)};
//     }
//     db.collection(database).remove(query, (err, result) => {
//       if (err) return next(err);
//       var response = req.body.query ? req.body.query : {};
//       res.json(response);
//     });
//   };
// };

// module.exports = Activity;
// http://mongoosejs.com/docs/schematypes.html

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ActivitySchema = new Schema({
  activity: { type: String, required: true },
  organizer_id: { type: Schema.Types.ObjectId, ref: 'users' },
  participants: { type: String },
  description: { type: String },
  img: { type: String },
  start_date: { type: Date },
  created_at: { type: Date, default: Date.now }
});

ActivitySchema.pre('save', next => {
  if (!this.created_at) this.created_at = new Date();
  this.start_date = new Date(this.start_date);
  next();
});

module.exports = mongoose.model('activities', ActivitySchema);

