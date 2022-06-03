const Router = require('express')

const controller = require('../controllers/userController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.get('/profile/:id', authMiddleware, controller.getProfile)

router.get('/get/:id', authMiddleware, controller.getUser)

router.get('/get-groups', authMiddleware, controller.getGroups)

router.get('/get-subscribers', authMiddleware, controller.getSubscribers)

router.get('/get-lists', authMiddleware, controller.getLists)

router.get('/get-popular-tags', authMiddleware, controller.getPopularTags)

router.get('/get-group-resources/:id', authMiddleware, controller.getResourcesByGroup)

router.post('/set-follow', authMiddleware, controller.setFollow)

router.post('/cancel-follow', authMiddleware, controller.cancelFollow)

router.post('/friend-finder', authMiddleware, controller.friendFinder)

router.post('/subscribers-finder', authMiddleware, controller.subscribersFinder)

module.exports = router