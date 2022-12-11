const { validationResult } = require('express-validator')
const { default: mongoose } = require('mongoose')
const { getUserByToken } = require('../helpers/functions')
const List = require('../models/List')
const Resource = require('../models/Resource')

class ListController {
  async listCreate(req, res) {
    try {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({message: 'Invalid data', errors})
      }

      const user = getUserByToken(req.headers.authorization)

      const { title } = req.body

      const list = new List({ title, owner: user.id })

      await list.save()
      return res.json({ list, message: 'List was successfully created!' })
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server list functional error. Try to check your entries.'})
    }
  }

  async getLists(req, res) {
    try {
      const lists = await List
        .find({})
        .sort({ 'dateCreate': -1 }) 
        .limit(15)

      return res.json(lists)
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server list functional error. Try to check your entries.'})
    }
  }

  async getListsByUserId (id) {
    try {
      return await List.find({ owner: id }).limit(15)
    } catch (error) {
      console.log(error)
    }
  }

  async listFinder(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { title = '' } =  req.body

      if (!title) {
        const lists = await List
          .find({ owner: user.id })
          .sort({ 'dateCreate': -1 }) 
          .limit(15)
        
          return res.status(200).json(lists)
      }

      const lists = await List.find({ owner: user.id, 'title': { $regex: new RegExp(title, 'i') } }).sort({ 'dateCreate': -1 }) 
      return res.status(200).json(lists)
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server list functional error. Try to check your entries.'})
    }
  }

  async updateList(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { title = '', _id = '' } = req.body
 
      if (!_id || !title.trim()) return res.status(400).json({ message: 'Invalid data. Check entries.' })
  
      const list = await List.findOne({ _id, owner: user.id })
  
      if (!list) return res.status(400).json({ message: `Can not find list to update` })
  
      if (user.id !== String(list.owner)) {
        return res.status(400).json({ message: `You do not have access to update it` })
      }

      const _list = await List.findOneAndUpdate(
        { 
          _id: list._id,
          owner: user.id
        },
        { $set: { title, dateUpdate: new Date() } },
        {new: true}
      )

      if (!_list) {
        return res.status(403).json({ message: 'Group do not exist or you do not have access to update it' })
      }

      return res.status(200).json({ list: _list, message: `List successfully updated` }) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server list functional error. Try to check your entries.'})
    }
  }

  async deleteList(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const { id = '' } =  req.params
  
      const list = await List.findOne({ _id: id })
  
      if (!list) {
        return res.status(400).json({ message: `Can not find list to delete` })
      }
  
      if (user.id !== String(list.owner)) {
        return res.status(400).json({ message: `You do not have access to delete it` })
      }
  
      // Delete list in resources
      await Resource.updateMany(
        { owner: user.id },
        { 
          $pull: { lists: mongoose.Types.ObjectId(list._id) } 
        })
  
      await List.deleteOne({ _id: String(list._id) })
  
      return res.status(200).json({ message: `List successfully deleted` }) 
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server list functional error. Try to check your entries.'})
    }
  }

  async getListsByUserId(id) {
    try {
      return await List
        .find({ owner: id })
        .sort({ 'dateCreate': -1 }) 
        .limit(15)
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server list functional error. Try to check your entries.'})
    }
  }
}

module.exports = new ListController()