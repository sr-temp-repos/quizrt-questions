var expect = require('chai').expect;
var request = require('supertest');


var app = require('../app');


describe('Express Routes Testing', function() {
  var cookie;
  describe('1. Checking Authentication layer', function() {
    it('1.1 Should be able to authenticate user with credentials', function(done) {
      request(app)
        .post('/login')
        .send({username: 'Penchalaiah', password: 'Pencha'})
        .expect(200)
        .end(function(err, res) {
          if(err) return done(err);
          expect(res.body.status).to.equal('success');
          cookie = res.headers['set-cookie'];
          // console.log(cookie);
          done();
        });
    });
    it('1.2 Should be able to sign up a new user', function(done) {
      request(app)
        .post('/signup')
        .send({
          username: 'test6',
          password: 'tests',
          email: 'test@test.com',
          firstName: 'test',
          lastName: 'test'
        })
        .expect(302)
        .expect('Location','/')
        .end(function(err, res) {
          if(err) return done(err);
          done();
        });
    });
    it('1.3 Should be able to Log off an user', function(done) {
      request(app)
        .get('/signout')
        .expect(302)
        .expect('Location', '/login')
        .end(function(err, res) {
          if(err) return done(err);
          // console.log(res.headers['set-cookie']);
          done();
        });
    });
    it("1.4 Don't allow access to any resource until authenticated", function(done) {
      request(app)
        .get('/')
        .expect(302)
        .expect('Location', '/login')
        .end(function(err, res) {
          if(err) return done(err);
          done();
          console.log('Redirection to Login page');
        });
    });
    it("1.5 Accessing resource after authentication", function(done) {
      request(app)
        .get('/')
        .set('cookie', cookie)
        .expect(200)
        .expect('Content-Type', /html/)
        .end(function(err, res) {
          if(err) return done(err);
          done();
        });
    });
  });

  describe('2. Getting Questions', function() {
    it('2.1 Listing first 50 questions', function(done) {
      request(app)
        .post('/QuestionRequestHandler')
        .send({
          requestType: 'search',
          query: '',
          firstQuestion: 0,
          count: 50
        })
        .set('cookie', cookie)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err);
          expect(res.body.rows).to.be.an('array');
          expect(res.body.rows.length).to.equal(50);
          expect(res.body.firstQuestion).to.equal(0);
          done();
        });
    });
    it("2.2 Query question with string 'database cat sport' in all search area's", function(done) {
      request(app)
        .post('/QuestionRequestHandler')
        .send({
          requestType: 'search',
          query: 'database cat sport',
          firstQuestion: 0,
          count: 50,
          searchIn: {
            all: true,
            ques: false,
            top: false,
            cat: false
          }
        })
        .set('cookie', cookie)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err);
          expect(res.body.rows).to.be.an('array');
          // expect(res.body.rows.length).to.equal(50);
          expect(res.body.firstQuestion).to.equal(0);
          done();
        });
    });
    it("2.2 Query question with string 'database' in question and topics area only", function(done) {
      request(app)
        .post('/QuestionRequestHandler')
        .send({
          requestType: 'search',
          query: 'database',
          firstQuestion: 0,
          count: 50,
          searchIn: {
            all: false,
            ques: true,
            top: true,
            cat: false
          }
        })
        .set('cookie', cookie)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err);
          expect(res.body.rows).to.be.an('array');
          expect(res.body.firstQuestion).to.equal(0);
          // expect(res.body.rows[0].question).to.contain('database');
          done();
        });
    });
    it("2.3 Query question with string 'database' in question area only", function(done) {
      request(app)
        .post('/QuestionRequestHandler')
        .send({
          requestType: 'search',
          query: 'database',
          firstQuestion: 0,
          count: 50,
          searchIn: {
            all: false,
            ques: true,
            top: false,
            cat: false
          }
        })
        .set('cookie', cookie)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err);
          expect(res.body.rows).to.be.an('array');
          expect(res.body.firstQuestion).to.equal(0);
          expect(res.body.rows[0].question).to.contain('database');
          done();
        });
    });
  });
});
