const express = require('express');
const multer = require('multer');
const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');



router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.use(authController.protect);
router.patch(
    '/updateMyPassword',
    authController.protect,
    authController.updatePassword
);
router.get('/me', authController.protect, userController.getMe, userController.getUser);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);



module.exports = router;