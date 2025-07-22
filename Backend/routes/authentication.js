const express = require('express');
const authenticationRoute = express.Router();
const authControllers = require('../controllers/authentication');

authenticationRoute.route('/signup').post(authControllers.signUpControl);
authenticationRoute.route('/login').post(authControllers.loginControl);
module.exports = authenticationRoute;
