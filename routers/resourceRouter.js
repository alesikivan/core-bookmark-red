const Router = require('express')
const { check } = require('express-validator')

const controller = require('../controllers/resourceController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.post('/create', authMiddleware, [
  check('link', 'Link can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('access', 'This access level do not exist').isIn(['public', 'subs', 'private']),
], controller.resourceCreate)

router.post('/delete-list', authMiddleware, controller.deleteResources)

router.post('/update-access', authMiddleware, controller.updateResourcesAccess)

router.post('/disable-explore-later', authMiddleware, controller.disableExploreLater)

router.get('/get/:id', authMiddleware, controller.getById)

router.put('/update', authMiddleware, [
  check('link', 'Link can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('access', 'This access level do not exist').isIn(['public', 'subs', 'private']),
], controller.updateResource)

router.delete('/delete/:id', authMiddleware, controller.deleteResource)

module.exports = router