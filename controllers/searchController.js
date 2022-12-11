const { validationResult } = require('express-validator')
const { getUserByToken } = require('../helpers/functions')

const Resource = require('../models/Resource')
const User = require('../models/User')
const List = require('../models/List')
const Group = require('../models/Group')
const Level = require('../models/Level')
const Cluster = require('../models/Cluster')
const Hierarchical = require('../models/Hierarchical')

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
        user = getUserByToken(req.headers.authorization, res)

      const {
        text = '',
        includeMy = false,
      } = req.body

      const find = { $match: { access: 'public' } }

      if (user) {
        if (!includeMy) 
          find['$match'].owner = { $not: { $eq: user.id } }
      }

      const response = await axios
        .get(`${process.env.PYTHON_SERVER}/search?query=${text}`)
      
      const {data: ids } = response

      find['$match'].bertId = { $in: ids }

      const resources = await Resource
        .aggregate([ 
          find, 
          { $limit : 50 }, 
          { "$addFields" : { "__order" : { "$indexOfArray" : [ ids, "$bertId" ] } } },
          { "$sort" : { "__order" : 1 } },
          { "$project": {"__order":0}} 
        ])

      // await List.populate(resources, {path: "lists",  select:  {_id: 1, title: 1, resources: 1}})
      // await Group.populate(resources, {path: "groups",  select:  {_id: 1, title: 1, resources: 1}})
      await User.populate(resources, {path: "owner",  select:  {_id: 1, username: 1}})

      return res.status(200).json( resources )

    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Can not find the bookmarks. Please try later.'})
    }
  }
  
  async smartSearch(req, res) {
    try {
      const { cluster = 10000 } = req.body

      const doublePartition = await Level.find({ parent: cluster })

      if (doublePartition.length === 2) {
        let parents = doublePartition.map(cluster => cluster.child)
        let children = await Level.find({ parent: parents })
    
        if (children.length < 4) {
          const clusters = await Cluster.find({ bertId: parents })
          return res.status(200).json({ clusters })
        }
    
        children = children.map(cluster => cluster.child)
    
        for (let i = 0; i < children.length; i++) {
          let id = children[i]
          let inheritance = await Level.find({ parent: id })
    
          if (inheritance.length === 2) {
            let ids = inheritance.map(cluster => cluster.child)

            // Get 3 parents and 2 child of 4 parent
            const _ids = [...children.filter(n => n !== id), ...ids]
            
            const clusters = await Cluster.find({ bertId: _ids })

            // const resourceIds = await Hierarchical.distinct('document', {cluster: {$in: [10005, 10006, 10004] }})
            // const resources = await Resource.find({ bertId: resourceIds }, { coordinates: 1, bertId: 1 })

            return res.status(200).json({ clusters, coordinates: [] })
          }
        }

        const clusters = await Cluster.find({ bertId: cluster })
        return res.status(200).json({ clusters })
      }

      // const hierarchicals = await Hierarchical.find({ cluster }, { document: 1, _id: 0})
      
      return res.status(200).json({ clusters: [] })
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Can not load the map. Please try later.'})
    }
  }

  async rectangleSearch(req, res) {
    try {
      const {
        x1 = 0, // Left bottom
        y1 = 0, // Left bottom
        x2 = 0, // Right top
        y2 = 0 // Right top
      } = req.body

      // [minX, minY, maxX, maxY]
      const rect = [+x1, +y1, +x2, +y2]

      let query = (rect.every(n => n === 0)) ? 
        `${process.env.PYTHON_SERVER}/visualizer/find/clusters`
        :
        `${process.env.PYTHON_SERVER}/visualizer/find/clusters?rect=${rect.join(',')}`
      
      const response = await axios.get(query)

      const { 
        clusters = [], 
        minX = 0, 
        maxX = 0, 
        minY = 0, 
        maxY = 0,
        coordinates = []
      } = response.data

      const clustersData = await Cluster.find({ bertId: clusters })
      
      let coordinatesData = []

      const treshold = 1000

      if (coordinates.length <= treshold) {
  
        coordinatesData = await Resource.find(
          {
            bertId: coordinates
          }, 
          { coordinates: 1, tags: 1, bertId: 1, link: 1, title: 1 }
        )
      }
      
      return res.status(200).json({ 
        clusters: clustersData,
        viewBox: [minX, minY, maxX, maxY],
        coordinates: coordinatesData
      })
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Error with rectangle search.'})
    }
  }

  async getRandomCoordinatesByRect(req, res) {
    try {
      const {
        minX = 0, 
        maxX = 0, 
        minY = 0, 
        maxY = 0,
        amount = 1000
      } = req.body

      const coordinates = await Resource
        .aggregate([
          { 
            $match: {
              $and: [
                { 'coordinates.x': { $gt: minX } },
                { 'coordinates.x': { $lt: maxX } },
                { 'coordinates.y': { $gt: minY } },
                { 'coordinates.y': { $lt: maxY } },
              ]
            }
          },
          {
            $sample: { size: amount } 
          }
        ])
      
      return res.status(200).json(coordinates)
    } catch (e) {
      console.log(e)
      return res.status(400).json({message: 'Error with rectangle search.'})
    }
  }
}

module.exports = new SearchController()