const Router = require('express')
const { check } = require('express-validator')

const controller = require('../controllers/searchController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.get('/default/resources', authMiddleware, controller.getDefaultResources)

router.post('/default/find', authMiddleware, controller.findDefalutResources)

router.post('/shared/find', controller.findSharedResources)

module.exports = router