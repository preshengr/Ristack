const User = require('../models/userModel');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
const jwt = require('jsonwebtoken');

const signToken = (id, user, statusCode, res) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUpControl = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  if (!user) {
    return next(new AppError('User not registered', 400));
  }
  signToken(user.id, user, 200, res);
});

exports.loginControl = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Invalid email or password', 400));
  }
  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Invalid email or password', 400));
  }
  signToken(user.id, user, 200, res);
});
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  //req.headers.authorization.Bearer = null;
  res.status(200).json({
    status: 'success',
    messege: 'user logged out',
  });
});
exports.protectControl = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(500).json({
      status: 'success',
      message: 'an error occured',
      error: err,
    });
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('user does no longer exits', 401));
  }
  if (currentUser.changedPassword(decoded.iat)) {
    return next(new AppError('Password was changed. Please login', 401));
  }
  req.user = currentUser;
  next();
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Unathorised action', 401));
    }
    next();
  };
};
