/* eslint-disable prettier/prettier */
/* eslint-disable import/newline-after-import */
const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const router = express.Router();
const reviewRouter = require('./reviewRoute');

// router.use('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRouter);
router.route('/top-5-cheaptour')
    .get(tourController.cheapTours, tourController.getAlltours);
router
    .route('/')
    .get(tourController.getAlltours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.newTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.getMonthlyPlan);


router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
    .route('/:id')
    .get(tourController.getTours)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.updateTours)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);
// Users Route

// router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReviews);

module.exports = router;