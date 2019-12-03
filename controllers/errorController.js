const AppError = require('./../utilities/appError');
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = err => {
  const value = err.errmssg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = 'Duplicate field value: x. Please use another value';
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => new AppError("Invalid token error", 401);
const handleTokenExpire = err => new AppError("Token expired", 401);
const handleJWTError = err => {
  const message = '';
  return new AppError(message, 400);
}

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Render in front end
    res.status('404').render('error', {
      title: 'Something went wrong',
      msg: err.message
    })
  }
};
const sendErrorProd = (err, req, res) => {
  // Operational error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // log error
    console.error('ERROR', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV == 'production') {
    let error = {
      ...err
    };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
  }
  if (error.code === 'JsonWebTokenError') error = handleJWTError(error);
  if (error.name === 'TokenExpiredError') error = handleTokenExpire(error);
};