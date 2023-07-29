const Router = require('express')

const controller = require('../controllers/contentController')

const authMiddleware = require('../middlewares/auth')
const { descriptionGeneratorValidation } = require('./validations/content')

const router = new Router()

router.post(
  '/auto-generate', 
  authMiddleware, 
  descriptionGeneratorValidation, 
  controller.descriptionGenerator)

module.exports = router