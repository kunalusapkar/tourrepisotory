const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Bookings = require('../models/bookingModel');
const catchAsync = require('../utilities/catchAsync');
const authController = require('../controllers/authController');
const AppError = require('../utilities/appError');


exports.getOverview = catchAsync(async (req, res) => {
    // get tour data from collection
    const tours = await Tour.find();
    // build template
    // render that template from tour data
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // get the data from requested tour
    const tour = await Tour.findOne({
        slug: req.params.slug
    }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with the name', 404));
    }
    // Build template

    // render template
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
});

exports.getAccount = catchAsync(async (req, res, next) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
});

exports.updateUserData = catchAsync(async (req, res) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    }, {
        new: true,
        runValidators: true
    });
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
    // find all bookings
    const bookings = await Bookings.find({
        user: req.user.id
    });
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({
        _id: {
            $in: tourIDs
        }
    });

    // find tours with returned IDs
    res.status(200).render('overview', {
        title: 'My Booked Tours',
        tours
    });
});