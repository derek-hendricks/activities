const bodyParser = require('body-parser'),
  express = require('express'),
  path = require('path'),
  methodOverride = require('method-override'),
  MongoClient = require('mongodb').MongoClient,
  parser = require('mongo-parse'),
  ObjectId = require('bson').ObjectId,
  env = require('node-env-file'),
  pug = require('pug');

// sudo rm /var/lib/mongodb/mongod.lock
// sudo service mongodb restart

const app = express()
const router = express.Router();
env(__dirname + '/.env');
const port = process.env.PORT || 3000;
var db;

const parseQuery = (query) => {
  return parser.parse(query).mapValues((field, stringId) => {
    if (field === '_id') return ObjectId(stringId)
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
  process.env.MONGO_URL,
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
    app.listen(port, () => {
      console.log('listening on ' + port);
    });
});

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/api', router);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

router.get('/activities', (req, res) => {
  db.collection('activities').find().sort({created_at: -1}).toArray(function(err, results) {
    if (err) return next(err);
    res.json({activities: results});
  });
});

router.get('/users', (req, res) => {
  db.collection('users').find().toArray(function(err, results) {
    if (err) return next(err);
    res.json({users: results});
  });
});

router.get('/users/:id', (req, res) => {
  db.collection('users').findOne({'_id': ObjectId(req.params.id)}, function(err, user) {
    if (err) return next(err);
    res.json({user});
  })
});

router.post('/users', (req, res) => {
  console.log('users post', req.body);
  db.collection('users').save(req.body, (err, result) => {
    if (err) return next(err);
    // TODO: res.json({}) and 're-'handle success callback
    res.json(result.ops[0]);
  });
});

router.put(['/activities/:id', '/users/:id'], (req, res) => {
  var update_query = req.body.query;
  var database = req.body.db;
  console.log('put update_query', update_query);
  db.collection(database).update({_id: ObjectId(req.params.id)}, update_query, (err, result) => {
    if (err) console.log(err);
    if (err) return next(err);
    console.log('success: ' + database + ' ' + req.params.id + ' edited:', update_query);
    res.json({});
  });
});

router.post('/activities', (req, res) => {
  db.collection('activities').save(req.body, (err, result) => {
    if (err) return next(err);
    // TODO: res.json({}) and 're-'handle success callback
    res.json({_id: result.ops[0]._id});
  });
});

router.get('/activities/:id', (req, res) => {
  db.collection('activities').findOne({'_id': ObjectId(req.params.id)}, function(err, activity) {
    if (err) return next(err);
    res.json(activity);
  });
});

router.delete(['/activities/:id', '/users/:id'], (req, res) => {
  var database = req.body.db;
  db.collection(database).remove({'_id': ObjectId(req.params.id)}, (err, result) => {
    if (err) return next(err);
    res.json({});
  });
});