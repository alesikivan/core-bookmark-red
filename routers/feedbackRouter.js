const Router = require('express')
const { check } = require('express-validator')

const controller = require('../controllers/feedbackController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.post('/create', authMiddleware, [
  check('topic', 'Topic of feedback can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('description', 'Description of feedback can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('description', 'Minimum 10 characters').isLength({ min: 10 })
], controller.feedbackCreate)

module.exports = router