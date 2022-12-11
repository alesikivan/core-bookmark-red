const { validationResult } = require('express-validator')
const { default: mongoose } = require('mongoose')

const { getUserByToken } = require('../helpers/functions')
const Group = require('../models/Group')
const User = require('../models/User')
const Moderation = require('../models/Moderation')
const Notification = require('../models/Notification')


class ModerationController {
  async moderationFinder(req, res) {
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

      const moderations = await Moderation
        .find(query)
        .sort({ 'dateCreate': -1 })
        .skip(skip)
        .limit(limit)

      const moderationsAmount = await Moderation
        .find(query)
        .count()

      return res.status(200).json( { moderations, moderationsAmount, limit } ) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server moderation functional error. Try to check your entries.'})
    }
  }

  async confirmGroupJoin(req, res) {
    const user = getUserByToken(req.headers.authorization)

    const { 
      type = '',
      subject = ''
    } = req.body

    if (!mongoose.isValidObjectId(subject)) {
      return res.status(400).json({ message: 'Not valid ID of subject.' })
    }

    if (type !== 'request-to-protected-group') {
      return res.status(400).json({ message: 'Not valid type of moderation.' })
    }

    const moderation = await Moderation
      .findOne({
        type, subject, reviewer: user.id
      })

    if (!moderation) {
      return res.status(400).json({ message: 'Moderation do not exist or you do not have access to it!' })
    }

    // Get default group role
    const moderationGroup = await Group.findOne({ 
      _id: subject,
      owner: user.id,
    })

    const role = moderationGroup.defaultRole + 's'

    // Change list of group moderation and group members
    const group = await Group.findOneAndUpdate(
      { _id: subject, owner: user.id },
      { 
        $push: { [role]: mongoose.Types.ObjectId(moderation.assignee) },
        $pull: { moderations: mongoose.Types.ObjectId(moderation.assignee) },
        $set: { dateUpdate: new Date() },
      }
    )

    if (!group) {
      return res.status(403).json({ message: 'Group do not exist or you do not have access to it!' })
    }
    
    // Send notification to assignee
    const notificationMessage = `Your request to group <a target="_blank" href="${process.env.CLIENT_URL}/group/view/${group._id}">${group.title}</a> was successfully accepted.`
    const notification = new Notification({
      assignee: group.owner,
      reviewer: moderation.assignee,
      status: 'fulfilled',
      message: notificationMessage,
      type: 'group',
      dateCreate: new Date(),
      dateUpdate: new Date()
    })

    await notification.save()

    // Remove moderation
    await Moderation.deleteOne({ 
      assignee: moderation.assignee,
      reviewer: user.id,
      subject,
      type,
    })

    return res.status(200).json( { message: 'You successfully confirm the access request!' } ) 
  }  
  
  async cancelGroupJoin(req, res) {
    const user = getUserByToken(req.headers.authorization)

    const { 
      type = '',
      subject = ''
    } = req.body

    if (!mongoose.isValidObjectId(subject)) {
      return res.status(400).json({ message: 'Not valid ID of subject.' })
    }

    if (type !== 'request-to-protected-group') {
      return res.status(400).json({ message: 'Not valid type of moderation.' })
    }

    const moderation = await Moderation
      .findOne({ type, subject, reviewer: user.id})

    if (!moderation) {
      return res.status(400).json({ message: 'Moderation do not exist or you do not have access to it!' })
    }

    // Change list of group moderation
    const group = await Group.findOneAndUpdate(
      { _id: subject, owner: user.id },
      { 
        $pull: { moderations: mongoose.Types.ObjectId(moderation.assignee) },
        $set: { dateUpdate: new Date() },
      }
    )

    if (!group) {
      return res.status(403).json({ message: 'Group do not exist or you do not have access to it!' })
    }

    // Send notification to assignee
    const notificationMessage = `Your request to join the group ${group.title} was denied.`
    const notification = new Notification({
      assignee: group.owner,
      reviewer: moderation.assignee,
      status: 'rejected',
      message: notificationMessage,
      type: 'group',
      dateCreate: new Date(),
      dateUpdate: new Date()
    })

    await notification.save()

    // Remove moderation
    await Moderation.deleteOne({ 
      assignee: moderation.assignee,
      reviewer: user.id,
      subject,
      type,
    })

    return res.status(200).json( { message: 'You successfully cancel the request of group access!' } ) 
  }


  // async deleteModeration(req, res) {
  //   try {
  //     const user = getUserByToken(req.headers.authorization)

  //     const { id = '' } =  req.params
  
  //     const group = await Group.findOne({ _id: id, owner: user.id })
  
  //     if (!group) {
  //       return res.status(400).json({ message: `Can not find group to delete` })
  //     }
  
  //     // Delete all groups in resources which contain them
  //     group.resources.forEach(async _id => {
  //       const resource = await Resource.findOne({ _id, owner: user.id })
  
  //       await Resource.updateOne(
  //         { _id: String(_id), owner: user.id },
  //         { $set: { 
  //           groups: resource.groups.filter(group => group != group._id)
  //         } }
  //       )
  //     })
  
  //     await Group.deleteOne({ _id: String(group._id) })
  
  //     return res.status(200).json({ message: `Group successfully deleted` }) 
  //   } catch (error) {
  //     console.log(error)
  //     return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
  //   }
  // }
}

module.exports = new ModerationController()