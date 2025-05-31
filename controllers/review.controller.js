const db = require('../models');
const { Op } = require('sequelize');
const listenersDB = require('../listeners');
const { Review, Reply, User, Article,  } = db;

// Get all reviews with replies
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [{ model: Reply, as: 'replies',
        include: [{ model: User, as: 'user' }]
       }],
      include: [{ model: User, as: 'user' }],
      order: [['submittedAt', 'DESC']]
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

exports.getData = async (req, res) => {
  try {
    // Run all DB queries in parallel for better performance
    const [users, team, reviews, articles, radioCount] = await Promise.all([
      User.findAll({ where: { role: 'reader' } }),
      User.findAll({ where: { role: { [Op.ne]: 'reader' } } }),
      Review.findAll({ where: { status: 'pending' } }),
      Article.findAll(),
      listenersDB.count({ roomId: 'radio-room' })
    ]);

    res.json({
      users: users.length,
      team: team.length,
      reviews: reviews.length,
      articles: articles.length + 4322, // Adjust if 4322 is a fixed legacy count
      radio: radioCount
    });

  } catch (err) {
    console.error('Failed to fetch dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};


exports.getReviewsByUser = async (req, res) => {
  const { userId } = req.userData; // this is the user ID
  try {
    const reviews = await Review.findAll({
      where: { userId }, // filter reviews by userId
      include: [
        {
          model: Reply,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user', // the user who made the reply
              attributes: ['id', 'username', 'email'] // or any fields you want
            }
          ]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user reviews.' });
  }
};


// Submit a new review
exports.submitReview = async (req, res) => {
  const { reviewText, contentTitle, fullMessage } = req.body;
  try {
    const newReview = await Review.create({ userId: req.userData?.userId||0, reviewText, contentTitle, fullMessage });
        let user = {
            username: 'Guest',
            profile_pic: 'https://t3.ftcdn.net/jpg/06/33/54/78/240_F_633547842_AugYzexTpMJ9z1YcpTKUBoqBF0CUCk10.jpg',
        };
        if(req.userData?.userId){
            user = await User.findByPk(req.userData?.userId);
            user.profile_pic = user.profile_pic || 'https://t3.ftcdn.net/jpg/06/33/54/78/240_F_633547842_AugYzexTpMJ9z1YcpTKUBoqBF0CUCk10.jpg'
        }
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Failed to submit review.' });
  }
};

// Update review status (approve/reject)
exports.updateReviewStatus = async (req, res) => {
  const { id, status } = req.params;

  // Allow only these status values
  const allowedStatuses = ['Pending', 'Approved', 'Rejected'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    review.status = status;
    await review.save();

    res.json({ message: 'Status updated.', review });
  } catch (err) {
    console.error('Error updating review status:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};


// Post a reply to a review
exports.postReply = async (req, res) => {
  const { reviewId } = req.params;
  const { admin, replyText } = req.body;
  try {
    const review = await Review.findByPk(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found.' });

    const reply = await Reply.create({ reviewId, userId: req.userData.userId, admin, replyText });
    res.status(201).json(reply);
  } catch (err) {
    res.status(400).json({ error: 'Failed to post reply.' });
  }
};

// Delete a review (and cascade delete replies)
exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Review.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'Review not found.' });
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review.' });
  }
};
