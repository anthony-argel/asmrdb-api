require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
const channelRouter = require('./routes/channelroute');
const tagRouter = require('./routes/tagroute');
const userRouter = require('./routes/userroute');
const commentRouter = require('./routes/commentroute');
const uploadRouter = require('./routes/uploadroute');
const channelRatingRouter = require('./routes/channelratingroute');
const userRatingRouter = require('./routes/userrattingroute');
const mongoose = require('mongoose');
const passport = require('passport');
require('./passport');

var app = express();

mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, ('connection error: ')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/magnet', uploadRouter);
app.use('/tag', tagRouter);
app.use('/channel', channelRouter);
app.use('/comment', commentRouter);
app.use('/channelrating', channelRatingRouter);
app.use('/user', userRouter);
app.use('/userrating', userRatingRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
