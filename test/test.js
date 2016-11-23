const chai = require('chai'),
  chaiHttp = require('chai-http'),
  server = require('../server'),
  ReplSetServers = require('mongodb').ReplSetServers,
  should = chai.should(),
  expect = chai.expect,
  MongoClient = require('mongodb').MongoClient,
  Server = require('mongodb').Server,
  ObjectId = require('bson').ObjectId;

var db, options = { replset: { socketOptions: { connectTimeoutMS: 30000 } }, server: { socketOptions: { connectTimeoutMS: 500 } } },
  user = { _id: 'alice@email.com', name: 'Alice'},
  user2 = {_id: "derek@email.com", activities: ['582ccc30de1cbe90df1a47df', '12345'], first_name: 'Derek', participant: 'true'},
  activity = { activity: 'Sailing', organizer_id: user._id, participants: 'Alice, Derek', description: 'travelling to Australia ', img: '/clipboard.png', start_date: '2016-11-09', created_at: new Date() };

chai.use(chaiHttp);

var createDoc = (col, doc, done, callback) => {
  db.collection(col).save(doc, (err, result) => {
    if (callback) return callback(err, result);
    done();
  });
};

var createUserDoc = (query, update, done, callback) => {
  db.collection('users').update(query, update, {upsert: true}, (err, result) => {
    if (callback) return callback(err, result);
    done();
  });
}

var reset = () => {
  db.collection('activities').remove({});
  db.collection('users').remove({});
  db.collection('images').remove({});
}

var updateDoc = (col, id, update, done, callback) => {
  db.collection(col).update({_id: id}, update, (err, result) => {
    if (callback) return callback(err, result);
    done();
  });
};

var fetchDocs = (col, callback) => {
  db.collection(col).find().sort({created_at: -1}).toArray((err, results) => {
    callback(err, results);
  });
};

var fetchDoc = (col, query, callback) => {
  db.collection(col).findOne(query, (err, result) => {
    callback(err, result);
  });
};

describe('Activities', () => {

  before((done) => {
    MongoClient.connect(process.env.TEST_DB_URL, options, (err, database) => {
      if (err) done();
      db = database;
      reset();
      db.collection('images').createIndex({text: 1}, {unique: true});
      db.collection('users').dropIndex({email: 1});
      createDoc('activities', activity, null, (err, result) => {
        if (err) done();
        activity._id = String(result.ops[0]._id);
        createUserDoc({_id: 'alice@email.com'}, {$set: {name: 'Alice Blue'}}, null, (err, result) => {
          done();
       });
      });
    });
  });

  after((done) => {
    reset();
    done();
  });

  describe('/GET activities', () => {
    it('should GET all activities', (done) => {
      chai.request(server)
        .get('/api/activities')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.activities.should.be.a('array');
          res.body.activities.length.should.be.eql(1);
          done();
      });
    });
  });

  describe('/GET users', () => {
    it('should GET all users', (done) => {
      chai.request(server)
        .get('/api/users')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.users.should.be.a('array');
          res.body.users.length.should.be.eql(1);
          done();
      });
    });
  });

  describe('/POST user', () => {
    var update = {$set: {name: 'Alice'}};
    var query = {_id: "alice@email.com"};
    var upsert = {upsert: 'true'};
    it('should update field of user that already exists', (done) => {
      chai.request(server)
        .post('/api/users')
        .send({query, update, upsert})
        .end((err, res) => {
          res.should.have.status(200);
          fetchDocs('users', (err, _users) => {
            _users.length.should.be.eql(1);
            _users[0].should.have.property('name').eql(update.$set.name);
            done();
          });
        });
    });
  });

  describe('/POST user', () => {
    var update = {$set: {hobby: 'biking'}};
    var query = {_id: "test@email.com"};
    var upsert = false;
    it('should not create user', (done) => {
      chai.request(server)
        .post('/api/users')
        .send({query, update, upsert})
        .end((err, res) => {
          fetchDocs('users', (err, _users) => {
            _users.length.should.be.eql(1);
            _users[0]._id.should.not.be.eql(query._id);
            done();
          });
        });
    });
  });

  describe('/POST activity', () => {
    var new_activity = { activity: 'Jogging', organizer_id: user._id, participants: 'Alice, Derek', description: 'jogging in Australia', img: '/clipboard.png', start_date: '2016-11-09', created_at: new Date() };
    it('should create an activity', (done) => {
      chai.request(server)
        .post('/api/activities')
        .send(new_activity)
        .end((err, res, model) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('activity');
          res.body.should.have.property('participants');
          res.body.should.have.property('description');
          res.body.should.have.property('img');
          res.body.should.have.property('start_date');
          res.body.should.have.property('organizer_id');
          fetchDocs('activities', (err, _activities) => {
            _activities.length.should.be.eql(2);
            done();
          });
        });
    });
  });

  describe('/POST user', () => {
    var query = {_id: 'derek1@email.com'};
    var update = {name: 'Derek'};
    var upsert = {upsert: 'true'};
    it('should create a user', (done) => {
      chai.request(server)
        .post('/api/users')
        .send({query,update, upsert})
        .end((err, res, model) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          fetchDocs('users', (err, _users) => {
            _users.length.should.be.eql(2);
            done();
          });
        });
    });
  });

  describe('/GET/:id activity', () => {
    it('it should GET activity by id', (done) => {
      chai.request(server)
      .get('/api/activities/' + activity._id)
      .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('activity');
          res.body.should.have.property('organizer_id');
          res.body.should.have.property('participants');
          res.body.should.have.property('description');
          res.body.should.have.property('img');
          res.body.should.have.property('start_date');
          res.body.should.have.property('created_at');
          res.body.should.have.property('_id').eql(String(activity._id));
          done();
      });
    });
  });

  describe('/GET/:id user', () => {
    it('it should GET user by id', (done) => {
      chai.request(server)
      .get('/api/users/' + user._id)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('name').eql(user.name);
        res.body.should.have.property('_id').eql(user._id);
        done();
      });
    });
  });

  describe('/PUT/:id activity', () => {
    it('it should UPDATE an activity', (done) => {
      var query = {$set: {description: 'Sailing into the Great Unknown'}};
      chai.request(server)
      .put('/api/activities/' + activity._id)
      .send({query: query, col: 'activities'})
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('nModified').eql(1);
        done();
      });
    });
  });

  describe('/PUT/:id user', () => {
    it('it should UPDATE user', (done) => {
      var query = {_id: 'derek1@email.com'};
      var update = {name: 'Derek1'};
      var upsert = {upsert: 'true'};
      chai.request(server)
      .post('/api/users')
      .send({query, update, upsert})
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('nModified').eql(1);
        done();
      });
    });
  });

  describe('/DELETE/:id activity', () => {
    it('should delete an activity', (done) => {
      chai.request(server)
      .delete('/api/activities/' + activity._id)
      .send({col: 'activities'})
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
         fetchDocs('activities', (err, _activities) => {
          _activities.length.should.be.eql(1);
          done();
         });
      });
    });
  });

  describe('/DELETE/:id user', () => {
    var query = {_id: 'derek1@email.com'};
    it('should delete a user', (done) => {
      chai.request(server)
      .delete('/api/users/' + query._id)
      .send({query})
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        fetchDocs('users', (err, _users) => {
          _users.length.should.be.eql(1);
          _users[0]._id.should.not.eql(query._id);
          done();
         });
      });
    });
  });

});
