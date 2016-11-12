"use strict";

const ObjectId = require('bson').ObjectId;

class User {
  constructor(_id, activity, organizer_id, participants, description, img, start_date, created_at) {
    this._id = _id;
    this.activity = activity;
    this.organizer_id = organizer_id;
    this.participants = participants;
    this.description = description;
    this.img = img;
    this.start_date = start_date;
    this.created_at = created_at;
  }

  static getUsers(db, req, res, next) {
    db.collection('users').find().sort({created_at: -1}).toArray((err, results) => {
      if (err) return next(err);
      res.json({users: results});
    });
  }

  static removeUsers(db, req, res, next) {
    var database = req.body.db, query;
    if (query = req.body.query) {
      query['_id']['$in'] = query['_id']['$in'].map((id) => { return ObjectId(id) });
    } else {
      query = {'_id': ObjectId(req.params.id)};
    }
    db.collection(database).remove(query, (err, result) => {
      if (err) return next(err);
      var response = req.body.query ? req.body.query : {};
      res.json(response);
    });
  }
}

module.exports = User;

