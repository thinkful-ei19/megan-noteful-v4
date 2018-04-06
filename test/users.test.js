'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI } = require('../config'); 

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.ensureIndexes();
  });

  afterEach(function () {
    return User.remove();
    // return User.collection.drop();
    // return mongoose.connection.db.dropDatabase()
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, fullname };

        let res;
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user._id.toString()).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
      it('Should reject users with missing username', function () {
        const testUser = { password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('username');
            expect(res.body.reason).to.equal('ValidationError');
          });
      });
      //should we try to query the database for a bad request?  The example provided didn't...

      /**
       * COMPLETE ALL THE FOLLOWING TESTS
       */
      it('Should reject users with missing password', function (){
        const testUser = { username, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=>err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('password');
            expect(res.body.reason).to.equal('ValidationError');

          });
      });
      it('Should reject users with non-string username', function (){
        const newUser = {username: 123, password, fullname};
        return chai.request(app).post('/api/users').send(newUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=> err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Incorrect field type');
            expect(res.body.location).to.equal('username');
            expect(res.body.reason).to.equal('ValidationError');
          });

      });
      it('Should reject users with non-string password', function(){
        const newUser = {username, password: 123, fullname};
        return chai.request(app).post('/api/users').send(newUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=>err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Incorrect field type');
            expect(res.body.location).to.equal('password');
            expect(res.body.reason).to.equal('ValidationError');
          });
      });
      it('Should reject users with non-trimmed username', function(){
        const newUser = {username: ' BadTrim ', password, fullname};
        return chai.request(app).post('/api/users').send(newUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=> err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
            expect(res.body.location).to.equal('username');
            expect(res.body.reason).to.equal('ValidationError');

          });
      });
      it('Should reject users with non-trimmed password', function(){
        const newUser = {username, password: ' BadTrim ', fullname};
        return chai.request(app).post('/api/users').send(newUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=> err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
            expect(res.body.location).to.equal('password');
            expect(res.body.reason).to.equal('ValidationError');
          });
      });
      it('Should reject users with empty username', function(){
        const newUser = {username: '', password, fullname};
        return chai.request(app).post('/api/users').send(newUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=> err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Must be at least 1 characters long');
            expect(res.body.location).to.equal('username');
            expect(res.body.reason).to.equal('ValidationError');
          });
      });
      it('Should reject users with password less than 8 characters', function(){
        const newUser = {username, password: 'samiam', fullname};
        return chai.request(app).post('/api/users').send(newUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=> err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Must be at least 8 characters long');
            expect(res.body.location).to.equal('password');
            expect(res.body.reason).to.equal('ValidationError');
          });
      });
      it('Should reject users with password greater than 72 characters', function(){
        const newUser = {username, password: 'tWctJSwdeAn8x6WsWseCdsGZ2P6KHVKp7qHQPHV4VUjg69kSWadQ2Qrc74NjCnyyyzAcGgWzCJ', fullname};
        return chai.request(app).post('/api/users').send(newUser)
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=> err.response)
          .then(res=>{
            expect(res).to.have.status(422);
            expect(res.body).to.be.an('object');
            expect(res.body.message).to.equal('Must be at most 72 characters long');
            expect(res.body.location).to.equal('password');
            expect(res.body.reason).to.equal('ValidationError');
          });
      });

      it('Should reject users with duplicate username', function(){
        const user1 = {username, password, fullname};
        const user2 = {username, password, fullname};
        return chai.request(app).post('/api/users').send(user1)
          .then(()=>{
            return chai.request(app).post('/api/users').send(user2);
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err=>err.response)
          .then(res=>{
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('The username already exists');
            expect(res.body.error).to.be.empty;
          });

      });
      it('Should trim fullname', function(){
        const newUser = {username, password, fullname:' Megan '};
        let res;
        return chai.request(app).post('/api/users').send(newUser)
          .then(_res=>{
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(newUser.username);
            expect(res.body.fullname).to.not.equal(newUser.fullname);
            expect(res.body.fullname.length).to.not.equal(newUser.fullname.length);
            expect(res.body.fullname.length).to.equal(5);
            expect(newUser.fullname.length).to.equal(7);



            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user._id.toString()).to.equal(res.body.id);
            expect(user.fullname).to.equal(res.body.fullname);
            expect(user.fullname).to.not.equal(newUser.fullname.length);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });

    
      });
    });

  });
});