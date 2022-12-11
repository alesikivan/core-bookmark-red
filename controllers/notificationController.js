const { validationResult } = require('express-validator')
const { default: mongoose } = require('mongoose')

const { getUserByToken } = require('../helpers/functions')
const Group = require('../models/Group')
const User = require('../models/User')
const Notification = require('../models/Notification')


class NotificationController {
  async notificationFinder(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const limit = 10

      const { 
        title = '',
        skip = 0
      } = req.body

      const query = { 
        message: { $regex: new RegExp(title, 'i') },
        reviewer: user.id
      }

      const notifications = await Notification
        .find(query)
        .sort({ 'dateCreate': -1 })
        .skip(skip)
        .limit(limit)

      const notificationsAmount = await Notification
        .find(query)
        .count()

      return res.status(200).json( { notifications, notificationsAmount, limit } ) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server notification functional error. Try to check your entries.'})
    }
  }

  async deleteNotification(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { 
        _id = '',
        type = 0
      } = req.body

      if (!mongoose.isValidObjectId(_id)) {
        return res.status(400).json({ message: 'Not valid ID of notification.' })
      }

      const notification = await Notification
        .findOne({ _id, type, reviewer: user.id})

      if (!notification) {
        return res.status(400).json({ message: 'Notification do not exist or you do not have access to modify it.' })
      }

      await Notification
        .deleteOne({ _id, type, reviewer: user.id})

      return res.status(200).json( { message: 'Notification successfully deleted' } ) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server notification functional error. Try to check your entries.'})
    }
  }
}

module.exports = new NotificationController()