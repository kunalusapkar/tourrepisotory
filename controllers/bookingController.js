const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const APIFeatures = require('./../utilities/apiFeatures');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // get currently booked tour
    const tour = await Tour.findById(req.params.tourID);

    // create check out session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [{
            name: `${tour.name} Tour`,
            description: `${tour.summary}`,
            amount: tour.price * 100,
            currency: 'usd',
            quantity: 1
        }]
    });
    // create session as response
    res.status(200).json({
        status: 'success',
        session
    })
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const {
//         tour,
//         user,
//         price
//     } = req.query;

//     if (!tour && !user && !price) return next();
//     await Booking.create({
//         tour,
//         user,
//         price
//     });
//     next();
//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({
        email: session.customer_email
    })).id;
    const price = session.line_items[0].amount / 100;
    await Booking.create({
        tour,
        user,
        price
    });
}

exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook error ${err.message}`);
    }
    if (event.type === 'checkout.session.complete')
        createBookingCheckout(event.data.object);

    res.status(200).json({
        recieved: true
    });
};
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
// exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);