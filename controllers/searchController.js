const { validationResult } = require('express-validator')
const { getUserByToken } = require('../helpers/functions')
const Resource = require('../models/Resource')

const axios = require('axios').default;

class SearchController {
  async getDefaultResources(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const resources = await Resource
        .find({ owner: user.id })
        .populate('groups', ['title', 'resources'])
        .populate('lists', ['title', 'resources'])
        .populate('owner', ['username'])
        .sort({ 'dateCreate': -1 }) 
        .limit(50)

      return res.status(200).json( resources )
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async findDefalutResources(req, res) {
    try {
      const user = getUserByToken(req.headers.authorization)

      const {
        text = '',
        sort = 'date_desc',
        groups = [],
        lists = [],
        exploreLater = false,
      } =  req.body

      const words = text.match( new RegExp(/(\w|[\u0400-\u04FF])+/, 'ig') )

      const sorting = {}
      
      if (exploreLater) sorting.exploreLater = -1

      if (sort === 'date_desc') sorting.dateCreate = -1
      if (sort === 'date_asc') sorting.dateCreate = 1

      if (groups.length && lists.length) {
        const resources = await Resource
        .find({ owner: user.id })
        .and({ description: { 
          $regex: new RegExp(words ? words.join('|') : ''  , 'i')
        } })
        .and({ groups: { $in: groups } })
        .and({ lists: { $in: lists } })
        .populate('groups', ['title', 'resources'])
        .populate('lists', ['title', 'resources'])
        .populate('owner', ['username'])
        .sort(sorting)
        .limit(50)

        return res.status(200).json( resources )
      }

      if (groups.length) {
        const resources = await Resource
        .find({ owner: user.id })
        .and({ description: { 
          $regex: new RegExp(words ? words.join('|') : ''  , 'i')
        } })
        .and({ groups: { $in: groups } })
        .populate('groups', ['title', 'resources'])
        .populate('lists', ['title', 'resources'])
        .populate('owner', ['username'])
        .sort(sorting)
        .limit(50)

        return res.status(200).json( resources )
      }

      if (lists.length) {
        const resources = await Resource
        .find({ owner: user.id })
        .and({ description: { 
          $regex: new RegExp(words ? words.join('|') : ''  , 'i')
        } })
        .and({ lists: { $in: lists } })
        .populate('groups', ['title', 'resources'])
        .populate('lists', ['title', 'resources'])
        .populate('owner', ['username'])
        .sort(sorting)
        .limit(50)

        return res.status(200).json( resources )
      }

      const resources = await Resource
      .find({ owner: user.id })
      .or({ description: { 
        $regex: new RegExp(words ? words.join('|') : ''  , 'i')
      } })
      .populate('groups', ['title', 'resources'])
      .populate('lists', ['title', 'resources'])
      .populate('owner', ['username'])
      .sort(sorting)
      .limit(50)

      return res.status(200).json( resources )
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async findSharedResources(req, res) {
    try {
      let user = {}
      
      if (req.headers.authorization)
        user = getUserByToken(req.headers.authorization)

      const {
        text = '',
        sort = 'date_desc',
        includeMy = false,
      } =  req.body

      const words = text.match( new RegExp(/(\w|[\u0400-\u04FF])+/, 'ig') )

      const sorting = {}

      if (sort === 'date_desc') sorting.dateCreate = -1
      if (sort === 'date_asc') sorting.dateCreate = 1

      let find = undefined

      if (includeMy) {
        find = { 
          // access: { $not: { $eq: 'private' } } 
          access: 'public'
        }
      } else {
        find = { 
          owner: { $not: { $eq: user.id } }, 
          access: 'public'
          // access: { $not: { $eq: 'private' } } 
        }
      }

      if (!req.headers.authorization) 
        find = { access: 'public' }

      const resources = await Resource
        .find(find)
        .or({ description: { 
          $regex: new RegExp(words ? words.join('|') : ''  , 'i')
        } })
        .or({ link: { 
          $regex: new RegExp(words ? words.join('|') : ''  , 'i')
        } })
        .populate('groups', ['title', 'resources'])
        .populate('lists', ['title', 'resources'])
        .populate('owner', ['username'])
        .sort(sorting)
        .limit(50)

      return res.status(200).json( resources )

    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }

  async findSharedResourcesByBERT(req, res) {
    try {
      let user = {}
      
      if (req.headers.authorization)
        user = getUserByToken(req.headers.authorization)

      const {
        text = '',
        includeMy = false,
      } = req.body

      const find = { $match: { access: 'public' } }

      if (!includeMy) {
        find['$match'].owner = { $not: { $eq: user.id } }
      }

      const response = await axios
        .get(`${process.env.PYTHON_SERVER}/search?query=${text}`)
      
      const ids = response.data.map(n => String(n))

      find['$match'].bert_id = { $in: ids }

      const resources = await Resource
        .aggregate([ find, { $limit : 50 } ])

      return res.status(200).json( resources )

    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Server resource functional error. Try to check your entries.'})
    }
  }
}

module.exports = new SearchController()