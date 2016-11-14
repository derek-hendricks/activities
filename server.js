const bodyParser = require('body-parser'),
  express = require('express'),
  path = require('path'),
  compression = require('compression'),
  methodOverride = require('method-override'),
  favicon = require('serve-favicon'),
  MongoClient = require('mongodb').MongoClient,
  parser = require('mongo-parse'),
  ObjectId = require('bson').ObjectId,
  pug = require('pug'),
  Flickr = require('flickrapi');

if (process.env.NODE_ENV != 'production') {
  env = require('node-env-file');
  env(__dirname + '/.env');
}

const app = express()
const router = express.Router();
const port = process.env.PORT || 5000;
var db, flickr;

const parseQuery = (query) => {
  return parser.parse(query).mapValues((field, stringId) => {
    if (field.indexOf('_id') > 1) return ObjectId(stringId);
    return stringId;
  });
};

const flickerApi = (search_options, callback) => {
  flickr.photos.search(search_options, (err,result) => {
    if (err) return callback(err);
    var photos = result.photos.photo, url, urls = [];
    if (!photos) return callback('No results found');
    for (var i = 0; i < photos.length; i++) {
      url = 'https://farm'+photos[i].farm+'.staticflickr.com/'+photos[i].server+'/'+photos[i].id+'_'+photos[i].secret+'.jpg';
      urls.push(url);
    }
    return callback(null, urls);
  });
};

var saveActivityImgUrls = (activity, callback) => {
  var image_set, search_options = {safe_search: 1, sort: 'relevance', content_type: 1, text: activity.text};
  flickerApi(search_options, (err, urls) => {
    if (err) return callback(err);
    if (((urls = urls || []) ? urls.length : 0) < 1) {
      return callback(null, {message: 'Could not find results for ' + activity.text}, null);
    }
    image_set = {urls: urls, text: activity.text, activity_id: activity.activity_id};
    db.collection('images').save(image_set, (err, result, options) => {
      callback(err, null, image_set);
    });
  });
};

app.use(methodOverride());

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

MongoClient.connect(
  process.env.DB_URL,
  { replset: {
    socketOptions: {
      connectTimeoutMS: 30000 }
    }, server: {
      socketOptions: {
        connectTimeoutMS: 500 }
      },
  },
  (err, database) => {
    if (err) return console.log(err);
    db = database;
    db.collection('users').createIndex({email: 1}, {unique: true});
    db.collection('images').createIndex({text: 1}, {unique: true});
    // db.collection('images').dropIndex({activity_id: 1});
     // db.createCollection("images", { size: 2147483648 } );
    app.listen(port, () => {
      console.log('listening on ' + port);
      var flickrOptions = {api_key: process.env.FLICKR_KEY, secret: process.env.FLICKR_SECRET, progress: false};
      Flickr.tokenOnly(flickrOptions, (err, _flickr) => {
        if (err) return console.log(err);
        flickr = _flickr;
      });
    });
});

app.set('view cache', true);
app.set('view engine', 'pug');
app.set('x-powered-by', false);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(compression());
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use('/api', router);
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', {title: 'Activities'});
});

router.get('/activities', (req, res, next) => {
  db.collection('activities').find().sort({created_at: -1}).toArray((err, results) => {
    if (err) return next(err);
    res.json({activities: results});
  });
});

router.get('/users', (req, res, next) => {
  db.collection('users').find().toArray((err, results) => {
    if (err) return next(err);
    res.json({users: results});
  });
});

router.get('/images', (req, res, next) => {
  db.collection('images').find().toArray((err, results) => {
    if (err) return next(err);
    res.json({images: results});
  });
});

router.get('/images/:id/text/:text', (req, res, next) => {
  console.log('req.params', req.params);
  db.collection('images').findOne({text: req.params.text}, (err, image) => {
    if (err || !image) return next(err);
    res.json(image);
  });
});

router.get('/images/:id', (req, res, next) => {
  db.collection('images').findOne({'activity_id': ObjectId(req.params.id)}, (err, image) => {
    if (err) return next(err);
    res.json(image);
  });
});

router.get('/users/:id', (req, res, next) => {
  console.log('/users/is', req.params);
  db.collection('users').findOne({'_id': ObjectId(req.params.id)}, (err, user) => {
    console.log(err, user);
    if (err) return next(err);
    res.json(user);
  });
});

router.get('/users/:email', (req, res, next) => {
  console.log('/users/email', req.params);
  db.collection('users').findOne({'email': req.params.email}, (err, user) => {
    if (err) return next(err);
    res.json(user);
  });
});

router.post('/users', (req, res, next) => {
  db.collection('users').save(req.body, (err, result) => {
    if (err) return next(err);

    res.json(result.ops[0]);
  });
});

router.put(['/activities/:id', '/users/:id'], (req, res, next) => {
  var update_query = req.body.query;
  var col = req.body.col;
  db.collection(col).update({_id: ObjectId(req.params.id)}, update_query, (err, result) => {
    if (err) return next(err);
    res.json(result);
  });
});

router.put('/images/:id', (req, res, next) => {
  if (!req.body.urls) return updateImage(req.body);
  if (flickr) saveActivityImgUrls(req.body, function(err, message, image_set) {
    if (err) return next(err);
    if (message) return res.json({image_set: image_set, error_message: message});
    updateImage(image_set);
    var updateImage = function(update_query) {
      db.collection(database).update({_id: ObjectId(req.params.id)}, update_query, (err, result) => {
        if (err) return next(err);
        res.json({});
      });
    };
  });
});

router.post('/images', (req, res, next) => {
  if (flickr) saveActivityImgUrls(req.body, function(err, message, image_set) {
    if (err) return next(err);
    if (message) return res.json({image_set, error_message: message});
    res.json(image_set);
  });
});

router.post('/activities', (req, res, next) => {
  var query = parseQuery(req.body);
  db.collection('activities').save(query, (err, result) => {
    if (err) return next(err);
    return res.json(result.ops[0]);
  });
});

router.get('/activities/:id', (req, res, next) => {
  db.collection('activities').findOne({'_id': ObjectId(req.params.id)}, function(err, activity) {
    if (err) return next(err);
    res.json(activity);
  });
});

router.delete(['/activities/:id', '/users/:id', '/images/:id'], (req, res, next) => {
  var col = req.body.col, query;
  if (query = req.body.query) {
    query['_id']['$in'] = query['_id']['$in'].map((id) => { return ObjectId(id) });
  } else {
    query = {'_id': ObjectId(req.params.id)};
  }
  db.collection(col).remove(query, (err, result) => {
    if (err) return next(err);
    var response = req.body.query ? req.body.query : {};
    res.json(response);
  });
});

module.exports = app;
