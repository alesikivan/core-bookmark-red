const Router = require('express')

const controller = require('../controllers/moderationController')
const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.post('/finder', authMiddleware, controller.moderationFinder)

router.post('/confirm-group-join', authMiddleware, controller.confirmGroupJoin)

router.post('/cancel-group-join', authMiddleware, controller.cancelGroupJoin)

// router.post('/delete', authMiddleware, controller.deleteModeration)

module.exports = router