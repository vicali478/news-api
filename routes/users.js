const express = require('express');
const userController = require('../controllers/user.controller');
const checkAuthMiddleware   = require('../middlewares/check-auth');
const multer = require('multer');
const { upLoadProfilePicture } = require('../middlewares/uploadMiddleware');

const upload = multer({ dest: 'temp/' });
const router = express.Router();
const cookie = require('../middlewares/set_cookie.js');

router.post('/register', checkAuthMiddleware.isUser,upload.fields([{ name: 'profile_pic', maxCount: 1 }
  ]), upLoadProfilePicture, userController.signUp, cookie.set);

router.get('/user', checkAuthMiddleware.check, userController.show);
router.get('/user/:id', checkAuthMiddleware.check, userController.findUser);
router.get('/users', checkAuthMiddleware.check, userController.all);
router.put('/updateRole', checkAuthMiddleware.check, userController.bulkUpdateUsers);
router.get('/team', checkAuthMiddleware.check, userController.team);
router.delete('/delete', checkAuthMiddleware.isUser, userController.deleteAccount);
router.get('/be_admin', checkAuthMiddleware.isUser, userController.beAdmin);
router.get('/admin', checkAuthMiddleware.admin, userController.admin);
router.put('/update', checkAuthMiddleware.isUser,upload.fields([{ name: 'profile_pic', maxCount: 1 }
  ]), upLoadProfilePicture, userController.update);
router.post('/login', checkAuthMiddleware.isUser, userController.login, cookie.set);
router.post('/logout', checkAuthMiddleware.isUser, userController.logout);
router.get('/protected', checkAuthMiddleware.isUser, (req, res) => {
    // Access token's expiry is already verified by middleware
    const message = req.message || 'Access granted';

    if(req.userData){
        const shouldRefresh = req.accessToken.exp - Math.floor(Date.now() / 1000);

        // Send response with a meaningful message and token expiry information
        res.json({
            message,
            expiry: shouldRefresh,
            user: req.userData.userId
        });
    } else {
        res.json({
            message,
            user: req.userData
        });

    }
});

module.exports = router;