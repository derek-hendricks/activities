'use strict'
const bodyParser = require('body-parser'),
  express = require('express'),
  path = require('path'),
  compression = require('compression'),
  moment = require('moment'),
  methodOverride = require('method-override'),
  favicon = require('serve-favicon'),
  MongoClient = require('mongodb').MongoClient,
  parser = require('mongo-parse'),
  ObjectId = require('bson').ObjectId,
  pug = require('pug'),
  Flickr = require('flickrapi');

if (process.env.NODE_ENV != "production") {
  let env = require("node-env-file");
  env(`${__dirname}/.env`);
}

let app = express()
let router = express.Router();
let port = process.env.PORT || 5000;
let db;
let flickr;

let parseQuery = (query) => {
  return parser.parse(query).mapValues((field, stringId) => {
    if (field.indexOf("_id") > 1) {
      return ObjectId(stringId);
    }
    return stringId;
  });
};

let flickerApi = (search_options, callback) => {
  let photos, urls = [], url;
  flickr.photos.search(search_options, (err, result) => {
    if (err) {
      return callback(err);
    }
    photos = result.photos.photo;
    if (!photos) {
      return callback(true);
    }
    for (let i = 0, l = photos.length; i < l; i++) {
      url = `https://farm${photos[i].farm}.staticflickr.com/${photos[i].server}/${photos[i].id}_${photos[i].secret}.jpg`;
      urls.push(url);
    }
    return callback(null, urls);
  });
};

let saveActivityImgUrls = (activity, callback) => {
  let search_options, err_msg, image_set;
  search_options = {
    safe_search: 1,
    sort: "relevance",
    content_type: 1,
    text: activity.text
  };
  err_msg = {
    message: `Could not find results for ${activity.text}`
  };
  flickerApi(search_options, (err, urls) => {
    if (err) {
      return callback(err);
    }
    if (((urls = urls || []) ? urls.length : 0) < 1) {
      return callback(null, err_msg, null);
    }
    image_set = {
      urls,
      text: activity.text
    };
    if (!activity.save) {
      return callback(null, null, image_set);
    }
    image_set.expireAt = moment().add(5, "days").toISOString();
    db.collection("images").save(image_set, (err, result, options) => {
      callback(err, null, image_set);
    });
  });
};

app.use(methodOverride());

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: err
  });
});

MongoClient.connect(
  process.env.DB_URL, {
    replset: {
      socketOptions: {
        connectTimeoutMS: 30000
      }
    },
    server: {
      socketOptions: {
        connectTimeoutMS: 500
      }
    },
  },
  (err, database) => {
    if (err) return console.log(err);
    db = database;
    app.listen(port, () => {
      console.log(`listening on ${port}`);
      let flickrOptions = {
        api_key: process.env.FLICKR_KEY,
        secret: process.env.FLICKR_SECRET,
        progress: true
      };
      Flickr.tokenOnly(flickrOptions, (err, _flickr) => {
        if (err) return console.log(err);
        flickr = _flickr;
      });
    });
  });

app.set("view cache", true);
app.set("view engine", "pug");
app.set("x-powered-by", false);

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json({
  type: "application/json"
}));

app.use(compression());
app.use(favicon(`${__dirname}/public/images/favicon.ico`));
app.use("/api", router);

app.use(express.static(path.join(__dirname, "dist"), {
  maxAge: 400000000
}));

app.use(express.static(path.join(__dirname, "public/css/bootstrap.css"), {
  maxAge: 900000000
}));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Activities"
  });
});

router.get("/activities", (req, res, next) => {
  db.collection("activities").find().toArray((err, results) => {
    if (err) return next(err);
    res.json({
      activities: results
    });
  });
});

router.get("/users", (req, res, next) => {
  db.collection("users").find().toArray((err, results) => {
    if (err) return next(err);
    res.json({
      users: results
    });
  });
});

router.get("/images", (req, res, next) => {
  db.collection("images").find().toArray((err, results) => {
    if (err) return next(err);
    res.json({
      images: results
    });
  });
});

router.get("/categories", (req, res, next) => {
  db.collection("categories").find().toArray((err, results) => {
    if (err) return next(err);
    res.json({
      categories: results
    });
  });
});

router.get("/categories/:id", (req, res, next) => {
  db.collection("categories").findOne({
    _id: req.params.id
  }, (err, result) => {
    if (err) return next(err);
    res.json(result);
  });
});

router.get("/images/:id", (req, res, next) => {
  db.collection("images").findOne({
    text: req.params.id
  }, (err, image) => {
    if (err) return next(err);
    if (!image) return res.json({
      message: `Could not find image ${req.params.text}`
    });
    res.json(image);
  });
});

router.get("/users/:id", (req, res, next) => {
  db.collection("users").findOne({
    _id: req.params.id
  }, (err, user) => {
    if (err) return next(err);
    res.json(user);
  });
});

router.post("/users", (req, res, next) => {
  db.collection("users").update(req.body.query, req.body.update, {
    upsert: !!req.body.upsert
  }, (err, result) => {
    if (err) return next(err);
    res.json(result);
  });
});

router.put("/users/:id", (req, res, next) => {
  let query = {
    _id: req.params.id
  };
  db.collection("users").update(query, req.body.query, (err, result) => {
    if (err) return next(err);
    res.json(result);
  });
});

router.put("/activities/:id", (req, res, next) => {
  let col = req.body.col;
  let query = {
    _id: ObjectId(req.params.id)
  };
  db.collection(col).update(query, req.body.query, (err, result) => {
    if (err) return next(err);
    res.json(result);
  });
});

router.put("/categories/:id", (req, res, next) => {
  let query = {
    _id: ObjectId(req.params.id)
  };
  db.collection("categories").update(query, req.body.query, (err, result) => {
    if (err) return next(err);
    res.json(result);
  });
});

router.put("/images/:id", (req, res, next) => {
  if (!req.body.urls) return updateImage(req.body);
  if (flickr) saveActivityImgUrls(req.body, (err, message, image_set) => {
    if (err) return next(err);
    if (message) return res.json({
      image_set,
      message
    });
    updateImage(image_set);
    let updateImage = update_query => {
      db.collection(database).update({
        _id: ObjectId(req.params.id)
      }, update_query, (err, result) => {
        if (err) return next(err);
        res.json({});
      });
    };
  });
});

router.post("/images", (req, res, next) => {
  if (flickr) saveActivityImgUrls({
    text: req.body.id,
    save: req.body.save
  }, (err, message, image_set) => {
    if (err) return next(err);
    if (message) return res.json({
      image_set,
      message
    });
    res.json(image_set);
  });
});

router.post("/categories", (req, res, next) => {
  db.collection("categories").save(req.body, (err, result) => {
    if (err) return next(err);
    return res.json({});
  });
});

router.post("/activities", (req, res, next) => {
  db.collection("activities").save(req.body, (err, result) => {
    if (err) return next(err);
    return res.json(result.ops[0]);
  });
});

router.get("/activities/:id", (req, res, next) => {
  db.collection("activities").findOne({
    "_id": ObjectId(req.params.id)
  }, (err, activity) => {
    if (err) return next(err);
    res.json(activity);
  });
});

router.delete("/users/:id", (req, res, next) => {
  db.collection("users").remove(req.body.query, (err, result) => {
    if (err) return next(err);
    res.json({});
  });
});

router.delete("/categories/:id", (req, res, next) => {
  db.collection("categories").remove(req.body.query, (err, result) => {
    if (err) return next(err);
    res.json({});
  });
});

router.delete(["/activities/:id", "/images/:id"], (req, res, next) => {
  let col = req.body.col;
  let query = req.body.query;
  if (!query) {
    query = {
      "_id": ObjectId(req.params.id)
    };
  } else if (query.all) {
    query = {};
  } else {
    query["_id"]["$in"] = query["_id"]["$in"].map((id) => {
      return ObjectId(id)
    });
  }
  db.collection(col).remove(query, (err, result) => {
    if (err) return next(err);
    res.json({});
  });
});

module.exports = app;