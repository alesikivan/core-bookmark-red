const { validationResult } = require('express-validator')

const { getUserByToken } = require('../helpers/functions')
const Resource = require('../models/Resource')
const Group = require('../models/Group')
const List = require('../models/List')
const Tag = require('../models/Tag')
const { default: mongoose } = require('mongoose')

class ResourceController {
  async resourceCreate(req, res) {
    try {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({message: 'Invalid data', errors})
      }
  
      const user = getUserByToken(req.headers.authorization)
  
      const { 
        link,
        access = 'public',
        description = '',
        tags = [],
        groups = [],
        lists = [],
        exploreLater = false
      } = req.body
  
      // Check unique   link
      const _resource = await Resource.findOne({ owner: user.id, link })
      if (_resource) {
        return res.status(400).json({ 
          message: `
            Resource with this url has been already created.
            Do you want to <a target="_blank" href="${process.env.CLIENT_URL}/resource/update/${_resource._id}">edit it</a>?
          ` 
        })
      }
  
      // Set rating to tag or create in global Tag collection
      tags.forEach(async tag => {
        const exist = await Tag.findOne({ title: tag })
  
        if (!exist) {
          // Tag do not exist
          const _tag = new Tag({ title: tag })
          await _tag.save()
        } else {
          await Tag.updateOne(
            { title: tag },
            { $set: { 
              rating: exist.rating + 0.001,
              dateUpdate: new Date()
             } }
          )
        }
      })
  
      const resource = new Resource({
        link,
        access,
        description,
        tags,
        groups,
        lists,
        exploreLater,
        owner: user.id,
        dateCreate: new Date()
      })
  
      await resource.save()
  
      // Save resources to group
      const newGroups = await Group.find({ _id: groups, owner: user.id })
      newGroups.forEach(async group => {
        await Group.updateOne(
          { _id: String(group._id), owner: user.id },
          { $set: { resources: [...group.resources, resource._id] } }
        )
      })
  
      // Save resources to list
      const newLists = await List.find({ _id: lists, owner: user.id })
      newLists.forEach(async list => {
        await List.updateOne(
          { _id: String(list._id), owner: user.id },
          { $set: { resources: [...list.resources, resource._id] } }
        )
      })
  
      return res.status(200).json({ resource, message: 'Resource was successfully created!' }) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async deleteResource(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id = '' } =  req.params
  
      const resource = await Resource.findOne({ _id: id, owner: user.id })
  
      if (!resource) {
        return res.status(400).json({ message: `Can not find resources to delete` })
      }
  
      if (user.id !== String(resource.owner)) {
        return res.status(400).json({ message: `You do not have access to delete it` })
      }

      // Delete in all groups
      const groups = await Group.find({ _id: resource.groups, owner: user.id })
      groups.forEach(async group => {
        await Group.updateOne(
          { _id: String(group._id), owner: user.id },
          { $set: { 
            resources: group.resources.filter(resId => String(resId) != String(resource._id))
          } }
        )
      })

      // Delete in all lists
      const lists = await List.find({ _id: resource.lists, owner: user.id })
      lists.forEach(async list => {
        await List.updateOne(
          { _id: String(list._id), owner: user.id },
          { $set: { 
            resources: list.resources.filter(resId => String(resId) != String(resource._id))
          } }
        )
      })

      await Resource.deleteOne({ _id: String(resource._id), owner: user.id })
  
      return res.status(200).json({ message: `Resource successfully deleted` }) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async getById(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id: _id } = req.params
  
      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of bookmark.' })
      }
  
      const resource = await Resource.findOne({ _id, owner: user.id })
  
      if (!resource) {
        return res.status(403).json({ message: 'Resource do not exist or you do not have access to it' })
      }
  
      return res.status(200).json(resource) 
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async updateResource(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({message: 'Invalid data', errors})
      }

      const {
        id: _id,
        link,
        access = 'public',
        description = '',
        tags = [],
        groups = [],
        lists = [],
        exploreLater = false
      } = req.body

      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of bookmark.' })
      }
  
      const previourResource = await Resource.findOne({ _id, owner: user.id })
  
      if (!previourResource) {
        return res.status(403).json({ message: 'Resource do not exist or you do not have access to it' })
      }

      // Set rating to tag or create in global Tag collection
      tags.forEach(async tag => {
        const exist = await Tag.findOne({ title: tag })
  
        if (!exist) {
          // Tag do not exist
          const _tag = new Tag({ title: tag })
          await _tag.save()
        } else {
          await Tag.updateOne(
            { title: tag },
            { $set: { 
              rating: exist.rating + 0.001,
              dateUpdate: new Date()
             } }
          )
        }
      })

      // Protect from similar user links
      const similar = await Resource.findOne({ link, owner: user.id })
      if (similar && String(similar._id) != String(_id)) {
        return res.status(400).json({message: 'You have already created the resource with this link'})
      }

      const resource = await Resource.findOneAndUpdate(
        { _id: _id, owner: user.id },
        { $set: {
          link,
          access,
          description,
          tags,
          groups,
          lists,
          exploreLater,
          dateUpdate: new Date()
        } }
      )
  
      // Remove all previous resources array from groups
      const previouGroups = await Group.find({ _id: previourResource.groups, owner: user.id })
      previouGroups.forEach(async group => {
        await Group.updateOne(
          { _id: String(group._id), owner: user.id },
          { $set: { 
            resources: group.resources.filter(res => {
              return String(res) != String(previourResource._id)
            })
          } }
        )
      })

      // Remove all previous resources array from listss
      const previousLists = await List.find({ _id: previourResource.lists, owner: user.id })
      previousLists.forEach(async list => {
        await List.updateOne(
          { _id: String(list._id), owner: user.id },
          { $set: { 
            resources: list.resources.filter(res => String(res) != String(previourResource._id))
          } }
        )
      })
     
      // Add all new resources array to groups
      const currentGroups = await Group.find({ _id: groups, owner: user.id })
      currentGroups.forEach(async group => {
        await Group.updateOne(
          { _id: String(group._id), owner: user.id },
          { $set: { 
            resources: [...group.resources, resource._id]
          } }
        )
      })
      
      // Add all new resources array to lists
      const currentLists = await List.find({ _id: lists, owner: user.id })
      currentLists.forEach(async list => {
        await List.updateOne(
          { _id: String(list._id), owner: user.id },
          { $set: { 
            resources: [...list.resources, resource._id]
          } }
        )
      })

      return res.status(200).json({ message: 'Bookmark has been successfully updated.' })
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async deleteResources(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { ids = [] } =  req.body

      const resources = await Resource.find({ _id: ids, owner: user.id })
  
      if (!resources.length) {
        return res.status(400).json({ message: `Can not find resource to delete` })
      }

      for (const resource of resources) {
        // Delete in all groups
        const groups = await Group.find({ _id: resource.groups, owner: user.id })
        groups.forEach(async group => {
          await Group.updateOne(
            { _id: String(group._id), owner: user.id },
            { $set: { 
              resources: group.resources.filter(resId => String(resId) != String(resource._id))
            } }
          )
        })

        // Delete in all lists
        const lists = await List.find({ _id: resource.lists, owner: user.id })
        lists.forEach(async list => {
          await List.updateOne(
            { _id: String(list._id), owner: user.id },
            { $set: { 
              resources: list.resources.filter(resId => String(resId) != String(resource._id))
            } }
          )
        })

        await Resource.deleteOne({ _id: String(resource._id), owner: user.id }) 
      }

      return res.status(200).json({ message: `Resources successfully deleted` }) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async updateResourcesAccess(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { 
        ids = [], 
        access = 'public' 
      } =  req.body

      const resources = await Resource.find({ _id: ids, owner: user.id })
  
      if (!resources.length) {
        return res.status(400).json({ message: `Can not find resource to delete` })
      }

      for (const resource of resources) {
        await Resource.findOneAndUpdate(
          { _id: resource._id },
          { $set: {
            access,
            dateUpdate: new Date()
          } }
        )
      }

      return res.status(200).json({ message: `Successfully access of resources updated` })
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: `Server resource functional error. Try to check your entries` })
    }
  }

  async disableExploreLater(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { 
        id = '', 
      } =  req.body

      await Resource.findOneAndUpdate(
        {  _id: id, owner: user.id },
        { $set: {
          exploreLater: false,
          dateUpdate: new Date()
        } }
      )
      
      return res.status(200).json({ message: `Successfully updated explore later mode of resource` })
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: `Server resource functional error. Try to check your entries` })
    }
  }
}

module.exports = new ResourceController()