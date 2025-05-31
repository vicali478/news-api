// routes/reviewRoutes.js
'use strict';

const express = require('express');
const router  = express.Router();

const reviewController   = require('../controllers/review.controller');
const checkAuthMiddleware = require('../middlewares/check-auth');


/* ---------- Routes ---------- */

router.get('/',checkAuthMiddleware.admin, reviewController.getAllReviews);
router.post('/',
  checkAuthMiddleware.isUser, reviewController.submitReview);
router.put('/:id/:status',checkAuthMiddleware.admin, reviewController.updateReviewStatus);
router.delete('/:id',
  checkAuthMiddleware.isUser, reviewController.deleteReview);

router.get('/user',
  checkAuthMiddleware.isUser, reviewController.getReviewsByUser);

// Routes for replies
router.post('/:reviewId/reply',
  checkAuthMiddleware.isUser, reviewController.postReply);

router.get('/data',
  checkAuthMiddleware.isUser, reviewController.getData);


module.exports = router;
