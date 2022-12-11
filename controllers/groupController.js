const { validationResult } = require('express-validator')
const { default: mongoose } = require('mongoose')

const { getUserByToken } = require('../helpers/functions')
const Group = require('../models/Group')
const User = require('../models/User')
const Moderation = require('../models/Moderation')
const Resource = require('../models/Resource')
const Role = require('../models/Role')


class GroupController {
  async groupCreate(req, res) {
    try {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.status(400).json({message: 'Invalid data', errors})
      }

      const user = getUserByToken(req.headers.authorization)

      const { 
        title, 
        accessLevel, 
        defaultRole, 
        groupPhoto = '', 
        keywords = [],
      } = req.body

      const clone = await Group.findOne({ title, owner: user.id, accessLevel })

      if (clone) return res.status(400).json({ message: 'You are already have the group with the same <b>title</b> and <b>access level</b>!' })

      // Check truth format of photo link
      if (groupPhoto && !groupPhoto.match(new RegExp(/^(ftp|http|https):\/\/[^ "]+$/))) {
        return res.status(400).json({ message: 'Invalid <b>photo url</b> data!' })
      }

      const group = new Group({
        title,
        accessLevel,
        defaultRole,
        groupPhoto,
        keywords,
        owner: user.id,
        dateCreate: new Date()
      })

      await group.save()
      return res.status(200).json({ group, message: 'Group was successfully created!' })
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }

  async groupUpdate(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({message: 'Invalid data', errors})
      }

      const {
        id: _id,
        title, 
        accessLevel, 
        defaultRole, 
        groupPhoto = '', 
        keywords = [],
      } = req.body

      // Validate the ID format
      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of group' })
      }

      // Check truth format of photo link
      if (groupPhoto && !groupPhoto.match(new RegExp(/^(ftp|http|https):\/\/[^ "]+$/))) {
        return res.status(400).json({ message: 'Invalid <b>photo url</b> data!' })
      }
  
      const group = await Group.findOneAndUpdate(
        { _id: _id, owner: user.id },
        { $set: {
          title,
          accessLevel,
          defaultRole,
          groupPhoto,
          keywords,
          dateUpdate: new Date()
        } }
      )

      if (!group) {
        return res.status(403).json({ message: 'Group do not exist or you do not have access to update it' })
      }
  
      return res.status(200).json({ message: 'Group has been successfully updated.' })
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }

  async getGroups(req, res) {
    try {
      const groups = await Group
        .find({})
        .sort({ 'dateCreate': -1 }) 
        .limit(15)

      return res.status(200).json(groups)
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }

  async getById(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)
      
      const { id: _id } = req.params
  
      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of group.' })
      }
  
      const group = await Group.findOne({ _id, owner: user.id })
  
      if (!group) {
        return res.status(403).json({ message: 'Group do not exist or you do not have access to it!' })
      }
  
      return res.status(200).json(group) 
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }

  async getGroupsByUserId (id) {
    try {
      return await Group
        .find({ owner: id })
        .populate('owner', ['username'])
        .sort({ 'dateCreate': -1 }) 
        .limit(15)
    } catch (error) {
      console.log(error)
    }
  }

  async followGroup(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id: _id = '' } =  req.body

      const group = await Group.findOne({ _id })

      const push = { $push: { [`${group.defaultRole}s`]: user.id } }

      switch(group.accessLevel) {
        case 'public':
          let result = await Group.findOneAndUpdate({ _id }, push, { upsert: true })

          if (!result) {
            return res.status(400).json({ message: `Can not find group` })
          }

          return res.status(200).json({ message: 'Successfully following to group!' })
      }

      return res.status(400).json({ message: 'Unsuccessfull subscribe. Try again.' })
    } catch (e) {
      console.log(e)
      return res.status(400).json({ message: 'Server group functional error. Try to check your entries.' })
    }
  }
  
  async cancelFollow(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id: _id = '' } =  req.body

      const group = await Group.findOneAndUpdate(
        { _id },
        { $pullAll: { 
          members: [String(user.id)],
          broadcasters: [String(user.id)],
          admins: [String(user.id)],
         } },
        { upsert: true }
      )

      if(!group) {
        return res.status(400).json({ message: 'Group not found.' })
      }

      return res.status(200).json({ group, message: 'Successfully cancel of following.' })
    } catch (e) {
      console.log(e)
      return res.status(400).json({ message: 'Server group functional error. Try to check your entries.' })
    }
  }

  async groupFinder(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const limit = 15

      const { 
        title = '',
        skip = 0
      } = req.body

      const query = { 
        // owner: { $not: { $eq: user.id } },
        title: { $regex: new RegExp(title, 'i') },
        accessLevel: { $in: ['public', 'request']} ,
      }

      const mongooseId = mongoose.Types.ObjectId(user.id)

      const groups = await Group
        .aggregate(
          [
            { $match: query },
            // Check the 'moderations' field is existing
            { $set: {
                moderations: {
                  $cond: {
                    if: {
                      $lte: ['$moderations', null]
                    },
                    then: [],
                    else: '$moderations'
                  }
                }
              }
            },
            {
              $addFields: { 
                // To show true buttons on group finder
                userPresence: {
                  $switch: {
                    branches: [
                      { 
                        case: { $in: [mongooseId, ['$owner']] },
                        then: 'owner' 
                      },
                      { 
                        case: { $in: [mongooseId, '$moderations'] },
                        then: 'pending' 
                      },
                      { 
                        case: {
                          $or: [
                            { $in: [mongooseId, '$broadcasters'] },
                            { $in: [mongooseId, '$admins'] },
                            { $in: [mongooseId, '$members'] }
                          ]
                        },
                        then: 'member' 
                      }
                    ],
                    default: 'new'
                  }
                },
                // Flag to redirect on group finder
                permission: {
                  $switch: {
                    branches: [
                      { 
                        case: {
                          $or: [
                            { $in: ['public', ['$accessLevel']] },
                            { $in: [mongooseId, ['$owner']] },
                            { $in: [mongooseId, '$broadcasters'] },
                            { $in: [mongooseId, '$admins'] },
                            { $in: [mongooseId, '$members'] }
                          ]
                        },
                        then: 'enable' 
                      },
                    ],
                    default: 'disable'
                  }
                }
              }
            },
            { $sort : { dateCreate : -1, } },
            { $project : { admins : 0 , broadcasters : 0, members: 0 } },
            { $limit : limit },
            { $skip : skip }
          ]
        )
      await User.populate(groups, { path: "owner",  select:  {_id: 1, username: 1} });

      const groupsAmount = await Group
        .find(query)
        .count()

      return res.status(200).json( { groups, groupsAmount, limit } ) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }

  async findGroup(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const limit = 10

      const { 
        title = '',
        skip = 0
      } = req.body

      const groups = await Group
        .find({ 
          owner: user.id, 
          title: { $regex: new RegExp(title, 'i') } 
        })
        .populate('owner', ['username'])
        .sort({ 'dateCreate': -1 })
        .skip(skip)
        .limit(limit)

      const groupsAmount = await Group
        .find({ 
          owner: user.id, 
          title: { $regex: new RegExp(title, 'i') } 
        })
        .count()

      return res.status(200).json( { groups, groupsAmount, limit } ) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }
  
  async followGroupByRequest(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { 
        _id = '', // group id
      } = req.body

      const assigneeId = user.id
      
      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of group.' })
      }

      const requestGroup = await Group.findOne({ _id, accessLevel: 'request' })

      if (!requestGroup) {
        return res.status(403).json({ message: 'Not valid group status. Reload the page.' })
      }

      if (!mongoose.isValidObjectId(assigneeId)) {
        return res.status(403).json({ message: 'Not valid ID of assignee.' })
      }
      
      // Update group moderation with new user
      const group = await Group.findOneAndUpdate(
        { _id },
        { $push: { moderations: mongoose.Types.ObjectId(assigneeId) } },
        { $set: { 
          dateUpdate: new Date()
        } }
      )
  
      if (!group) {
        return res.status(403).json({ message: 'Group do not exist or you do not have access to it!' })
      }

      const assignee = await User.findOne({ _id: assigneeId })

      const message = `The user with name <a target="_blank" href="${process.env.CLIENT_URL}/user/view/${assignee._id}">${assignee.username}</a> wants to join your group <b>${group.title}</b>.`

      // Add a moderation to the list
      const moderation = new Moderation({
        assignee: assigneeId,
        reviewer: group.owner,
        subject: group._id,
        status: 'pending',
        message,
        type: 'request-to-protected-group',
        dateCreate: new Date(),
        dateUpdate: new Date()
      })

      await moderation.save()

      return res.status(200).json( { message: 'Your group request has been poisoned!'} ) 
    } catch (error) {
      console.log(error)
      return res.status(400).json( { message: 'Server group functional error. Try to check your entries.'} )
    }
  }

  async cancelFollowGroupByRequest(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { 
        _id = '', // group id
      } = req.body

      const assigneeId = user.id
      
      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of group.' })
      }

      const requestGroup = await Group.findOne({ _id, accessLevel: 'request' })

      if (!requestGroup) {
        return res.status(403).json({ message: 'Not valid group status. Reload the page.' })
      }

      if (!mongoose.isValidObjectId(assigneeId)) {
        return res.status(403).json({ message: 'Not valid ID of assignee.' })
      }
      
      // Update group moderation with new user
      const group = await Group.findOneAndUpdate(
        { _id },
        {
          $pull: { moderations: mongoose.Types.ObjectId(assigneeId) }, 
          $set: { dateUpdate: new Date() } 
        }
      )
  
      if (!group) {
        return res.status(403).json({ message: 'Group do not exist or you do not have access to it!' })
      }

      // Remove a moderation from the list
      await Moderation.deleteOne({ 
        assignee: assigneeId,
        type: 'request-to-protected-group',
        subject: group._id
      })

      return res.status(200).json( { message: 'Your group request has been canceled!'} ) 
    } catch (error) {
      console.log(error)
      return res.status(400).json( { message: 'Server group functional error. Try to check your entries.'} )
    }
  }

  async deleteGroup(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id = '' } =  req.params
  
      const group = await Group.findOne({ _id: id, owner: user.id })
  
      if (!group) {
        return res.status(400).json({ message: `Can not find group to delete` })
      }
  
      // Delete the group in resources
      await Resource.updateMany({},
        { 
          $pull: { groups: mongoose.Types.ObjectId(group._id) } 
        })

      // Delete all moderations where the group is subject
      await Moderation.deleteMany({ subject: group._id })
  
      await Group.deleteOne({ _id: String(group._id) })
  
      return res.status(200).json({ message: `Group successfully deleted` }) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }
}

module.exports = new GroupController()