const { validationResult } = require('express-validator')
const { default: mongoose } = require('mongoose')

const { getUserByToken } = require('../helpers/functions')
const Group = require('../models/Group')
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
        owner: user.id
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

      const { title = '' } =  req.body

      const groups = await Group
        .find({ 
          owner: { $not: { $eq: user.id } },
          title: { $regex: new RegExp(title, 'i') },
          accessLevel: { $in: ['public']} ,
          // accessLevel: { $in: ['public', 'request']} ,
        })
        .populate('owner', ['username'])
        .sort({ 'dateCreate': -1 }) 

      return res.status(200).json(groups) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }

  async findGroup(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { title = '' } =  req.body
  
      if (!title) {
        const groups = await Group
          .find({ owner: user.id })
          .populate('owner', ['username'])
          .sort({ 'dateCreate': -1 }) 
          .limit(15)
          
        return res.status(200).json(groups)
      }
  
      const groups = await Group
        .find({ 
          owner: user.id, 
          title: { $regex: new RegExp(title, 'i') } 
        })
        .populate('owner', ['username'])
        .sort({ 'dateCreate': -1 }) 

      return res.status(200).json(groups) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
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
  
      // Delete all groups in resources which contain them
      group.resources.forEach(async _id => {
        const resource = await Resource.findOne({ _id, owner: user.id })
  
        await Resource.updateOne(
          { _id: String(_id), owner: user.id },
          { $set: { 
            groups: resource.groups.filter(group => group != group._id)
          } }
        )
      })
  
      await Group.deleteOne({ _id: String(group._id) })
  
      return res.status(200).json({ message: `Group successfully deleted` }) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server group functional error. Try to check your entries.'})
    }
  }
}

module.exports = new GroupController()