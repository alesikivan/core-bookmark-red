const Router = require('express')
const { check } = require('express-validator')
const passport = require('passport')

const controller = require('../controllers/authController')

// const authMiddleware = require('../middlewares/auth') // usage: router.post('/test', authMiddleware, controller.test)
// const roleMiddleware = require('../middlewares/role') // usage: router.post('/test', roleMiddleware(['USER', 'ADMIN']), controller.test)

// const authValidators = require('../controllers/validators/authValidators')

const router = new Router()

router.post('/register', [
  check('username', 'Username can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('password', 'Password can not be less 6 charts and more then 15 charts').isLength({min: 6, max: 15}),
  check('email').isEmail(),
], controller.register)

router.post('/login', controller.login)

router.post('/forgot-password', controller.forgotPassword)

router.post('/reset-password', controller.resetPassword)

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
  controller.googleAuth
)

module.exports = router