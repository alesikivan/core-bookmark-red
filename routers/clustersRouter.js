const Router = require('express')

const controller = require('../controllers/clusterController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.post(
  '/prepare', 
  authMiddleware, 
  controller.clustersPreparing)

router.post(
  '/get-descriptions', 
  authMiddleware, 
  controller.getDescriptions)

module.exports = router