require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var compression = require('compression');
var helmet = require('helmet');

const channelRouter = require('./routes/channelroute');
const tagRouter = require('./routes/tagroute');
const userRouter = require('./routes/userroute');
const commentRouter = require('./routes/commentroute');
const channelRatingRouter = require('./routes/channelratingroute');
const userRatingRouter = require('./routes/userrattingroute');
const boardRouter = require('./routes/boardroute');
const threadRouter = require('./routes/threadroute');
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

mongoose.set('useFindAndModify', false);
app.use(helmet());
app.use(compression()); //Compress all routes
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

const Channel = require('./models/channel');
const Tag = require('./models/tag');
const User = require('./models/user');
const async = require('async');
const ChannelRating = require('./models/channelrating');

app.get('/statistics', (req, res) => {
  async.parallel({
    channels: function(cb) {
      Channel.countDocuments().exec(cb);
    },
    tags: function(cb) {
      Tag.countDocuments().exec(cb);
    },
    users: function(cb) {
      User.countDocuments().exec(cb);
    },
    reviews: function(cb) {
      ChannelRating.countDocuments().exec(cb);
    }
  }, (err, results) => {
    if(err) {return res.sendStatus(400)}
    res.status(200).json({channels: results.channels, tags: results.tags, users: results.users, reviews: results.reviews})
  })
})

app.use('/tag', tagRouter);
app.use('/channel', channelRouter);
app.use('/comment', commentRouter);
app.use('/channelrating', channelRatingRouter);
app.use('/user', userRouter);
app.use('/board', boardRouter);
app.use('/thread', threadRouter);
//app.use('/userrating', userRatingRouter);


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
  res.send(res.locals.message);
});

module.exports = app;
