const Router = require('express')

const controller = require('../controllers/clusterController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.post(
  '/check-cluster-cache', 
  authMiddleware, 
  controller.checkClusterCache)

router.post(
  '/save-cluster-cache', 
  authMiddleware, 
  controller.saveClusterCache)

router.post(
  '/prepare/other', 
  authMiddleware, 
  controller.otherClustersPreparing)

router.post(
  '/prepare/first', 
  authMiddleware, 
  controller.firstClustersPreparing)

router.post(
  '/prepare/other', 
  authMiddleware, 
  controller.otherClustersPreparing)

router.post(
  '/check-galaxies', 
  authMiddleware, 
  controller.checkGalaxies)

router.post(
  '/get-descriptions', 
  authMiddleware, 
  controller.getDescriptions)

module.exports = router