const Router = require('express')
const { check } = require('express-validator')

const controller = require('../controllers/groupController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.post('/create', authMiddleware, [
  check('title', 'Title of group can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('title', 'Minimum 3 and maximum 20 characters').isLength({ min: 3, max: 20 }),
  check('accessLevel', 'This access level do not exist').isIn(['public', 'request', 'hidden']),
  check('defaultRole', 'This default role do not exist').isIn(['member', 'broadcaster', 'admin']),
], controller.groupCreate)

router.put('/update', authMiddleware, [
  check('title', 'Title of group can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('title', 'Minimum 3 and maximum 20 characters').isLength({ min: 3, max: 20 }),
  check('accessLevel', 'This access level do not exist').isIn(['public', 'request', 'hidden']),
  check('defaultRole', 'This default role do not exist').isIn(['member', 'broadcaster', 'admin']),
], controller.groupUpdate)

router.get('/get', authMiddleware, controller.getGroups)

router.get('/get/:id', authMiddleware, controller.getById)

router.post('/find-group', authMiddleware, controller.findGroup)

router.post('/find-following-group', authMiddleware, controller.findFollowingGroup)

router.post('/finder', authMiddleware, controller.groupFinder)

router.post('/set-follow', authMiddleware, controller.followGroup)

router.post('/cancel-follow', authMiddleware, controller.cancelFollow)

router.delete('/delete/:id', authMiddleware, controller.deleteGroup)

router.post('/follow-group-by-request', authMiddleware, controller.followGroupByRequest)

router.post('/cancel-follow-group-by-request', authMiddleware, controller.cancelFollowGroupByRequest)

module.exports = router