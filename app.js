const path = require('path');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();
const userRouter = require('./routes/userRoute');
const tourRouter = require('./routes/tourRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const reviewRouter = require('./routes/reviewRoute');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// body parser reading data from req body
app.use(
  express.json({
    limit: '10kb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb'
  })
);

app.use(cookieParser());

// data sanitazation against nosql query inject
app.use(mongoSanitize());
// data sanitazation against XSS attack
app.use(xss());
// Security set http headers
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);
app.use(compression());
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request fromt this IP ,please try in an hour'
});
app.use('/api', limiter);

// app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Cant find ${req.originalUrl} the url`
  // });
  // const err = new Error(`Cant find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
// Users

// get request
// app.get('/api/v1/tours', getAlltours);
// get data by id
// app.get('/api/v1/tours/:id', getTours);
// post request
// app.post('/api/v1/tours', newTours);
// update
// app.patch('/api/v1/tours/:id', updateTours);
// delete method
// eslint-disable-next-line prettier/prettier
// app.delete('/api/v1/tours/:id', deleteTour);
