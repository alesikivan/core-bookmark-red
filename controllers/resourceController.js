const { validationResult } = require('express-validator')

const { getUserByToken } = require('../helpers/functions')
const Resource = require('../models/Resource')
const Group = require('../models/Group')
const List = require('../models/List')
const Tag = require('../models/Tag')
const { default: mongoose } = require('mongoose')
const { default: axios } = require('axios')

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

      const mongooseUserId = mongoose.Types.ObjectId(user.id)
      
      // Check unique link
      const _resource = await Resource.findOne({ owner: user.id, link })
      if (_resource) {
        return res.status(400).json({ 
          message: `
            Resource with this url has been already created.
            Do you want to <a target="_blank" href="${process.env.CLIENT_URL}/resource/update/${_resource._id}">edit it</a>?
          ` 
        })
      }

      const { isBERT, embeddings } = await isBERTbelonging(description)

      // Check permision to group adding
      const vilidgroupIds = groups.map(id => mongoose.Types.ObjectId(id))
      const groupsPermissions = await Group
        .aggregate(
          [
            { 
              $match: { 
                _id: { $in: vilidgroupIds },
                $or: [
                  { owner: mongooseUserId },
                  { broadcasters: { $in: [mongooseUserId] } },
                  { admins: { $in: [mongooseUserId] } },
                ],
              } 
            }
          ]
        )

      if (!(groupsPermissions.length === groups.length)) {
        return res.status(400).json({ message: 'You do not have access to this groups'} )
      }
  
      // Set rating to tag or create in global Tag collection
      // Optimize later
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
        isBERT,
        embeddings,
        exploreLater,
        owner: user.id,
        dateCreate: new Date()
      })
  
      await resource.save()
  
      // Save resource to groups
      await Group.updateMany(
        { 
          _id: { $in: groups },
          $or: [
            { owner: { $in: [mongooseUserId] } },
            { broadcasters: { $in: [mongooseUserId] } },
            { admins: { $in: [mongooseUserId] } }
          ]
        },
        { $push: { resources: mongoose.Types.ObjectId(resource._id) } })
  
      // Save resources to list
      await List.updateMany(
        { 
          _id: { $in: lists },
          owner: { $in: [mongooseUserId] }
        },
        { $push: { resources: mongoose.Types.ObjectId(resource._id) } })
  
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

      // Delete resources in groups
      await Group.updateMany({},
        { $pull: { resources: mongoose.Types.ObjectId(resource._id) } })

      // Delete resources in lists
      await List.updateMany({},
        { $pull: { resources: mongoose.Types.ObjectId(resource._id) } })

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

      const mongooseUserId = mongoose.Types.ObjectId(user.id)

      if (!mongoose.isValidObjectId(_id)) {
        return res.status(403).json({ message: 'Not valid ID of bookmark.' })
      }
  
      const previourResource = await Resource.findOne({ _id, owner: user.id })
  
      if (!previourResource) {
        return res.status(403).json({ message: 'Resource do not exist or you do not have access to it' })
      }

      const { isBERT, embeddings } = await isBERTbelonging(description)

      // Check permision to group adding
      const vilidGroupIds = groups.map(id => mongoose.Types.ObjectId(id))
      const groupsPermissions = await Group
        .aggregate(
          [
            { 
              $match: { 
                _id: { $in: vilidGroupIds },
                $or: [
                  { owner: mongooseUserId },
                  { broadcasters: { $in: [mongooseUserId] } },
                  { admins: { $in: [mongooseUserId] } },
                ],
              } 
            }
          ]
        )

      if (!(groupsPermissions.length === groups.length)) {
        return res.status(400).json({ message: 'You do not have access to this groups'} )
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
          isBERT, 
          embeddings,
          exploreLater,
          dateUpdate: new Date()
        } }
      )      

      // Remove all previous resources from groups
      const vilidPreviousGroups = previourResource.groups.map(id => mongoose.Types.ObjectId(id))
      await Group.updateMany(
        { 
          _id: { $in: vilidPreviousGroups }, 
          $or: [
            { owner: mongooseUserId },
            { broadcasters: { $in: [mongooseUserId] } },
            { admins: { $in: [mongooseUserId] } },
          ],
        },
        { $pull: { resources: mongoose.Types.ObjectId(resource._id) } })

      // Remove all previous resources array from listss
      const vilidPreviousLists = previourResource.lists.map(id => mongoose.Types.ObjectId(id))
      await List.updateMany(
        { 
          _id: { $in: vilidPreviousLists }, 
          owner: user.id 
        },
        { $pull: { resources: mongoose.Types.ObjectId(resource._id) } })
     
      // Add all new resources array to groups
      await Group.updateMany(
        { 
          _id: { $in: vilidGroupIds }, 
          $or: [
            { owner: mongooseUserId },
            { broadcasters: { $in: [mongooseUserId] } },
            { admins: { $in: [mongooseUserId] } },
          ]
        },
        { $push: { resources: mongoose.Types.ObjectId(resource._id) } })

      // Add all new resources array to lists
      const vilidListIds = lists.map(id => mongoose.Types.ObjectId(id))
      await List.updateMany(
        { 
          _id: { $in: vilidListIds }, 
          owner: user.id 
        },
        { $push: { resources: mongoose.Types.ObjectId(resource._id) } })

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
      
      // Delete the resources in the groups
      await Group.updateMany(
        { 
          resources: { $in: ids }, 
          owner: user.id 
        },
        { $pullAll: { resources: ids } })

      // Delete the resources in the lists
      await List.updateMany(
        { 
          resources: { $in: ids }, 
          owner: user.id 
        },
        { $pullAll: { resources: ids } })
      
      // Delete all resources
      await Resource.deleteMany({ 
        _id: { $in: ids }, 
        owner: user.id 
      }) 

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

async function isBERTbelonging(description) {
  // Check belonging to BERT (not empty description and no russian letters)
  let isBERT = !!description.trim() && !/[\u0400-\u04FF]/.test(description)
  let embeddings = []

  if (isBERT) {
    const text = encodeURIComponent(description)
    const { data } = await axios
      .get(`${process.env.PYTHON_SERVER}/prepare/embeddings?abstract=${text}`)
     
    const [preparedEmbeddings] = data
    isBERT = !!preparedEmbeddings
    embeddings = [...preparedEmbeddings || []]
  }

  return { isBERT, embeddings }
}

module.exports = new ResourceController()