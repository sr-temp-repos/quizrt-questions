var express = require('express'),
    router = express.Router(),
    path = require('path');



var Auth = {
  getLoginPage: function(req, res, next) {
    res.sendFile(path.join(__dirname, '../public/FilesNoAuth/login.html'));
  },
  /* Handle Login POST */
  login: function(passport) {
    return function(req, res, next) {
      passport.authenticate('login', function(err, user, info) {
        if (err) {
          return next(err); }
        if (!user) {
          return res.json({status: 'failure'});
        }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
          res.json({status: 'success'});
        });
      })(req, res, next);
    };
  },

  /* Handle Registration POST */
  signup: function(passport) {
    return function(req, res, next) {
      passport.authenticate('signup', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/signup'); }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
          res.redirect('/');
        });
      })(req, res, next);
    };
  },

  /* Handle All other routes */
  AuthenticateRequest: function(req,res,next) {
    if(req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/login');
    }
  }
};

module.exports = function(passport){
  Auth.passport = passport;
  return Auth;
}
