/* eslint-disable */
const {
    promisify
} = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const Email = require('./../utilities/email');
const signToken = id => {
    return jwt.sign({
            id
        },
        process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });
    const url = 0;
    await new Email(newUser, url).sendWelcome();
    const token = signToken(newUser._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        secure: true,
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    newUser.password = undefined;
    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
    createSendToken(newUser, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
    const {
        email,
        password
    } = req.body;

    //   1)Check if email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide an email and password', 400));
    }

    // Check if user exists and password is correct
    const user = await User.findOne({
        email
    }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // if everything is ok send token to the client
    // const token = signToken(user._id);
    // console.log(token);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    // Get the token and check if its there
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
        return next(
            new AppError('You are not logged in ! Please login to access', 401)
        );
    }
    // verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // if vertify success check if users still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError('The user belonging to token does not exists', 401)
        );
    }
    // check if user change password after token was issued

    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password please login again', 401)
        );
    }
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

//only for render pages with no error
exports.isLoggedIn = catchAsync(async (req, res, next) => {
    // Get the token and check if its there
    let token;
    if (req.cookies.jwt) {
        try {
            // verify the token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );
            // if vertify success check if users still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }
            // check if user change password after token was issued

            if (currentUser.changePasswordAfter(decoded.iat)) {
                return next();
            }
            // there is logged in user
            // req.user = currentUser;
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
});

// protect front end

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You dont have permission to perform this action', 403)
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // get user from posted email
    const user = await User.findOne({
        email: req.body.email
    });
    if (!user) {
        return next(new AppError('There is  no user.', 404));
    }
    // generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({
        validateBeforeSave: false
    });


    // const message = `Forgot you password submit a patch request with ur password to ${resetURL}`;

    try {
        // Send it to users email
        const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Send succesfully'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({
            validateBeforeSave: false
        });
        return next(
            new AppError('There was error sending an email Try later', 500)
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // get user  based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gt: Date.now()
        }
    });
    // if token has not expired and there is user,set the new password
    if (!user) {
        return next(new AppError('Token is invalid', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // update changepassword property for user
    // log in user send JWT
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});

exports.updatePassword = async (req, res, next) => {
    // get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // check if posted current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Token is invalid', 400));
    }

    // if so update pass word
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // log user in send jwt
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        status: 'success'
    });
};