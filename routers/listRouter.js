const Router = require('express')
const { check } = require('express-validator')

const controller = require('../controllers/listController')

const authMiddleware = require('../middlewares/auth')

const router = new Router()

router.get('/get', authMiddleware, controller.getLists)

router.post('/create', authMiddleware, [
  check('title', 'Title of list can not be empty').notEmpty().custom((value) => !!value.trim()),
  check('title', 'Minimum 3 and maximum 15 characters').isLength({ min: 3, max: 15 }),
], controller.listCreate)

router.put('/update', authMiddleware, controller.updateList)

router.post('/finder', authMiddleware, controller.listFinder)

router.delete('/delete/:id', authMiddleware, controller.deleteList)

module.exports = router