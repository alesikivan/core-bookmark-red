const Router = require('express')

const controller = require('../controllers/searchController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.get('/default/resources', authMiddleware, controller.getDefaultResources)

router.post('/default/find', authMiddleware, controller.findDefalutResources)

router.post('/shared/find', controller.findSharedResources)

router.post('/bert/shared/find', controller.findSharedResourcesByBERT)

router.post('/smart', authMiddleware, controller.smartSearch)

router.post('/rectangle', authMiddleware, controller.rectangleSearch)

router.post('/random/coordinates', authMiddleware, controller.getRandomCoordinatesByRect)

module.exports = router