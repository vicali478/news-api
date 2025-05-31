const express = require('express');
const webController = require('../controllers/web.controller');
const checkAuthMiddleware = require('../middlewares/check-auth');
const router = express.Router();

router.get("/auth", checkAuthMiddleware.isUser, webController.auth);
router.get("/create", checkAuthMiddleware.admin, webController.create);
router.get("/news", webController.news);
router.get("/article", webController.article);
router.get("/article2", webController.article2);
router.get('/radio', webController.radio);
router.get('/admin-radio',checkAuthMiddleware.admin, webController.adminRadio);
router.get('/admin',checkAuthMiddleware.admin, webController.admin);
router.get('/about', webController.about);
router.get('/contact', webController.contact);
router.get('/admin/reviews',checkAuthMiddleware.admin, webController.reviews);
router.get('/user/reviews', checkAuthMiddleware.check, webController.myReviews);
router.get('/videos', webController.videos);
router.get('/team',checkAuthMiddleware.admin, webController.team);
router.get('/users',checkAuthMiddleware.admin, webController.users);
router.get('/dashboard',checkAuthMiddleware.admin, webController.dashboard);
router.get('/settings',checkAuthMiddleware.check, webController.settings);
router.get('/programs',checkAuthMiddleware.admin, webController.program);

module.exports = router;
