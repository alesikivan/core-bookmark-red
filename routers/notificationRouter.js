const Router = require('express')

const controller = require('../controllers/notificationController')
const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.post('/finder', authMiddleware, controller.notificationFinder)

router.post('/delete', authMiddleware, controller.deleteNotification)

module.exports = router