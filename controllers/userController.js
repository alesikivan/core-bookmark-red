const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const Role = require('../models/Role')
const User = require('../models/User')
const Tag = require('../models/Tag')
const Group = require('../models/Group')
const { getUserByToken } = require('../helpers/functions')
const groupController = require('./groupController')
const listController = require('./listController')
const { default: mongoose } = require('mongoose')
const Resource = require('../models/Resource')

class UserController {
  async getById(id) {
    try {
      return await User.find({ _id: id })
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getByEmail(email) {
    try {
      return await User.findOne({ email })
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getProfile(req, res) {
    try {
      const client = getUserByToken(req.headers.authorization)
      const { id: _id } = req.params

      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of group.' })
      }

      if (client.id != _id) {
        return res.status(403).json({ message: `You can not visit this page` })
      }

      const resourcesAmount = await Resource.find({ owner: _id })
  
      const user = await User
        .aggregate(
          [
            {
              $match: { 
                _id: new mongoose.Types.ObjectId(_id)
              }
            },
            {
              $project: {
                username: 1,
                profilePhoto: 1,
                followers: 1,
                following: 1,
              }
            },
            {
              $addFields: { 
                resourcesAmount: resourcesAmount.length
              }
            },
            { $limit: 1 }
          ]
        )
  
      if (!user) {
        return res.status(403).json({ message: 'User do not exist' })
      }

      return res.status(200).json(user)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getUser(req, res) {
    try {
      const { id: _id } = req.params

      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of group.' })
      }

      const resourcesAmount = await Resource.find({ owner: _id })
  
      const user = await User
        .aggregate(
          [
            {
              $match: { 
                _id: new mongoose.Types.ObjectId(_id)
              }
            },
            {
              $project: {
                username: 1,
                profilePhoto: 1,
                followers: 1,
                following: 1,
              }
            },
            {
              $addFields: { 
                resourcesAmount: resourcesAmount.length
              }
            },
            { $limit: 1 }
          ]
        )
  
      if (!user) {
        return res.status(403).json({ message: 'User do not exist' })
      }

      return res.status(200).json(user)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getGroups(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const groups = await groupController.getGroupsByUserId(user.id)

      return res.status(200).json(groups)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getFollowers(req, res) {
    try {
      const client = getUserByToken(req.headers.authorization)

      const user = await User
        .findOne({ _id: client.id })
        .populate('followers', ['username', 'email'])

      if (!user) {
        return res.status(403).json({ message: 'User do not exist' })
      }

      const { followers } = user

      return res.status(200).json( followers )
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getFollowings(req, res) {
    try {
      const client = getUserByToken(req.headers.authorization)

      const user = await User
        .findOne({ _id: client.id })
        .populate('following', ['username', 'email', 'profilePhoto'])

      if (!user) {
        return res.status(403).json({ message: 'User do not exist' })
      }

      const { following } = user

      return res.status(200).json( following )
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async subscribersFinder(req, res) {
    try {
      const client = getUserByToken(req.headers.authorization)

      const { title = '' } = req.body

      const users = await User
        .find(
          { 
            following: { $in: [ mongoose.Types.ObjectId(client.id) ] },
            title: { $regex: new RegExp(title, 'i')}
          }
         )
        .or({ 
          email: { $regex: new RegExp(title, 'i')}
        })

      return res.status(200).json( users )
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getResourcesByGroup(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id: _id } = req.params

      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of group.' })
      }

      const mongooseUserId = mongoose.Types.ObjectId(user.id)

      const request = await Group.findOne({ _id, moderations: { $in: [mongooseUserId] } })

      if (request) {
        return res.status(403).json({ message: 'Your request <b>to join the group</b> is still pending. Please wait.' })
      }
      
        const group = await Group
          .findOne({ 
            _id, 
            $or: [
              { owner: mongooseUserId },
              { accessLevel: 'public' },
              { members: { $in: [mongooseUserId] } },
              { broadcasters: { $in: [mongooseUserId] } },
              { admins: { $in: [mongooseUserId] } },
            ]
          }, {
            members: 0,
            admins: 0,
            broadcasters: 0
          })
          .populate('owner', ['username'])
          .populate({
            path : 'resources',
            populate : [
              { path: 'lists' },
              { path: 'groups' },
              { path: 'owner' },
            ]
          })

      if (!group) {
        return res.status(403).json({ message: 'Group do not exist or you do not have access to it' })
      }
  
      return res.status(200).json(group) 
    } catch (e) {
      console.log(e)
    }
  }

  async setFollow(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id: _id } = req.body

      // Update user followers
      const following = await User.findOneAndUpdate(
        { _id },
        { $push: { followers: user.id } },
        { upsert: true }
      )

      // Update cureent user following
      const follower = await User.findOneAndUpdate(
        { _id: user.id },
        { $push: { following: _id } },
        { upsert: true }
      )

      if(!follower || !following) {
        return res.status(400).json({ message: 'User not found.' })
      }
      
      return res.status(200).json({ message: 'Successfully subscribe!' })
    } catch (e) {
      console.log(e)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async cancelFollow(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id: _id } = req.body

      // Update user followers
      const following = await User.findOneAndUpdate(
        { _id },
        { $pullAll: { followers: [String(user.id)] } },
        { upsert: true }
      )

      // Update cureent user following
      const follower = await User.findOneAndUpdate(
        { _id: user.id },
        { $pullAll: { following: [String(_id)] } },
        { upsert: true }
      )

      if(!follower || !following) {
        return res.status(400).json({ message: 'User not found.' })
      }
      
      return res.status(200).json({ message: 'Successfully unsubscribe!' })
    } catch (e) {
      console.log(e)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async followingsFinder(req, res) {
      const { id, title, skip } = req.body

      if (!mongoose.isValidObjectId(id)) {
        return res.status(403).json({ message: 'Not valid ID of user.' })
      }

      const user = await User.findOne({ _id: id })

      const limit = 5

      const addFields = {
        $addFields: { 
          status: {
            $switch: {
              branches: [
                { 
                  case: {
                    $and: [
                      { $in: [ '$_id', user.followers ] },
                      { $in: [ '$_id', user.following ] },
                    ]
                  },
                  then: 'friend' 
                },
                { 
                  case: { $in: [ '$_id', user.followers ] },
                  then: 'follower' 
                },
                { 
                  case: { $in: [ '$_id', [mongoose.Types.ObjectId(id)] ] },
                  then: 'me' 
                },
                { 
                  case: { $in: [ '$_id', user.following ] },
                  then: 'following'  
                },
              ],
              default: "new"
            }
          }
        }
      }

      const match = { 
        $match: { 
          followers: { $in: [mongoose.Types.ObjectId(id)] },

          $or: [
            { username: { $regex: new RegExp(title, 'i') }, },
            { email: { $regex: new RegExp(title, 'i') }, }
          ]
        }
      }

      const users = await User
        .aggregate(
          [
            match,
            {
              $project: {
                username: 1,
                profilePhoto: 1,
                email: 1,
              }
            },
            addFields,
            { $skip: skip },
            { $limit : limit }
          ]
        )

      const amount = await User
        .aggregate(
          [
            match,
            { $count: "usersAmount" } // Output: [{ usersAmount: 1 }] || []
          ]
        )
      
      const usersAmount = amount.length ? amount[0].usersAmount : 0

      return res.status(200).json( { users, usersAmount, limit } )
  }

  async followersFinder(req, res) {
    const { id, title, skip } = req.body

    if (!mongoose.isValidObjectId(id)) 
      return res.status(403).json({ message: 'Not valid ID of user.' })

    const limit = 5

    const match = { 
      $match: { 
        following: { $in: [mongoose.Types.ObjectId(id)] },

        $or: [
          { username: { $regex: new RegExp(title, 'i') }, },
          { email: { $regex: new RegExp(title, 'i') }, }
        ]
      }
    }

    const users = await User
      .aggregate(
        [
          match,
          {
            $project: {
              username: 1,
              profilePhoto: 1,
              email: 1,
            }
          },
          { $skip: skip },
          { $limit : limit }
        ]
      )

    const amount = await User
      .aggregate(
        [
          match,
          { $count: "usersAmount" } // Output: [{ usersAmount: 1 }] || []
        ]
      )
    
    const usersAmount = amount.length ? amount[0].usersAmount : 0

    return res.status(200).json( { users, usersAmount, limit } )
  }

  async friendFinder(req, res) {
    try {
      const client = getUserByToken(req.headers.authorization)

      const { 
        title,
        friends: friendsOnly = false,
        followers: followersOnly = false,
        following: followingOnly = false,
        news: newsOnly = false,
       } = req.body

      if (!title.trim()) return res.status(200).json( [] )

      const user = await User.findOne({ _id: client.id })

      if (!user) return res.status(400).json({ message: 'Can not find user.' })

      let match = { 
        $match: { 
          $or: [
            { username: { $regex: new RegExp(title, 'i') } },
            { email: { $regex: new RegExp(title, 'i') } }
          ]
        }
      }

      if (friendsOnly) {
        match = { 
          $match: { 
            followers: { $in: [mongoose.Types.ObjectId(client.id)] },
            following: { $in: [mongoose.Types.ObjectId(client.id)] },

            $or: [
              { username: { $regex: new RegExp(title, 'i') }, },
              { email: { $regex: new RegExp(title, 'i') }, }
            ]
          }
        }
      }

      if (followersOnly) {
        match = { 
          $match: { 
            following: { $in: [mongoose.Types.ObjectId(client.id)] },
            followers: { $nin: [mongoose.Types.ObjectId(client.id)] },

            $or: [
              { username: { $regex: new RegExp(title, 'i') }, },
              { email: { $regex: new RegExp(title, 'i') }, }
            ]
          }
        }
      }
      
      if (followingOnly) {
        match = { 
          $match: { 
            followers: { $in: [mongoose.Types.ObjectId(client.id)] },
            following: { $nin: [mongoose.Types.ObjectId(client.id)] },

            $or: [
              { username: { $regex: new RegExp(title, 'i') }, },
              { email: { $regex: new RegExp(title, 'i') }, }
            ]
          }
        }
      }

      if (newsOnly) {
        match = { 
          $match: { 
            followers: { $nin: [mongoose.Types.ObjectId(client.id)] },
            following: { $nin: [mongoose.Types.ObjectId(client.id)] },

            $or: [
              { username: { $regex: new RegExp(title, 'i') }, },
              { email: { $regex: new RegExp(title, 'i') }, }
            ]
          }
        }
      }

      const users = await User
        .aggregate(
          [
            match,
            {
              $project: {
                username: 1,
                profilePhoto: 1,
                email: 1,
              }
            },
            {
              $addFields: { 
                status: {
                  $switch: {
                    branches: [
                      { 
                        case: {
                          $and: [
                            { $in: [ '$_id', user.followers ] },
                            { $in: [ '$_id', user.following ] },
                          ]
                        },
                        then: 'friend' 
                      },
                      { 
                        case: { $in: [ '$_id', user.followers ] },
                        then: 'follower' 
                      },
                      { 
                        case: { $in: [ '$_id', [mongoose.Types.ObjectId(client.id)] ] },
                        then: 'me' 
                      },
                      { 
                        case: { $in: [ '$_id', user.following ] },
                        then: 'following'  
                      },
                    ],
                    default: "new"
                  }
                }
              }
            },
            { $limit : 15 }
          ]
        )

      return res.status(200).json( users )
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getLists(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const lists = await listController.getListsByUserId(user.id)

      res.status(200).json(lists)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }
  
  async getPopularTags(req, res) {
    try {
      const tags = await Tag
      .find({})
      .sort({ rating: -1 })
      .limit(15)

      res.status(200).json(tags)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async addGoogleUser ({ id, email, firstName, lastName, profilePhoto, fullName }) {
    try {
      const password = uuidv4()
      let hash = await bcrypt.hash(password, 7)

      const roles = await Role.findOne({ value: 'USER' })

      const user = new User({
        email, roles ,username: fullName, password: hash, profilePhoto, source: 'google'
      })

      return await user.save()
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }

  async getResetData() {
    try {
      const resetToken = crypto.randomBytes(20).toString('hex')
  
      // Set token to `resetPasswordToken` field
      let resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    
      // Set expire
      let resetPasswordExpire = Date.now() + 10 * 60 * 1000
    
      return { resetToken, resetPasswordToken, resetPasswordExpire }
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'Server user functional error. Try to check your entries.' })
    }
  }
}

module.exports = new UserController()