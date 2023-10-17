const { default: axios } = require("axios")

const Galaxy = require('../models/Galaxy')
const ClusterCache = require("../models/ClusterCache")

class ClusterController {
  async firstClustersPreparing(req, res) {
    try {
      const { ids } = req.body

      if (ids.length === 0) return res.status(200).json({ clusters: [] })

      const { data } = await axios
        .post(`${process.env.PYTHON_SERVER}/prepare/first/clusters`, { ids })

      return res.status(200).json({ ...data })
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Invalid clustering' })
    }
  }

  async checkDescriptionCache(req, res) {
    try {
      // [ { id: 1, keywords: 'doctor, surgeon, hospital' }, ... ]
      const { clusters } = req.body

      const keywordsList = clusters.map(cluster => cluster.keywords)

      const cacheClusters = await Galaxy.find({ keywords: { $in: keywordsList } })

      const cachedIds = []
      const cached = []
      const fresh = []

      clusters.forEach(cluster => {
        const cacheCluster = cacheClusters.find(cacheCluster => cacheCluster.keywords === cluster.keywords)
        if (cacheCluster) {
          // Добавляем те кластера, что уже были просчитаны
          cached.push({
            ...cluster,
            topic: cacheCluster.topic,
            description: cacheCluster.description,
          })

          cachedIds.push(cacheCluster._id)
        } else {
          fresh.push(cluster)
        }
      })

      await Galaxy.updateMany(
        { _id: { $in: cachedIds } },
        { 
          $set: { dateUpdate: new Date() } 
        })
      
      return res.status(200).json({ cached, fresh })
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Invalid clustering cache' })
    }
  }

  async saveDescriptionCache(req, res) {
    try {
      const { clusters } = req.body

      let prepared = clusters.map(cluster => {
        const {
          topic = '',
          description = '',
          keywords = ''
        } = cluster
        return {
          topic,
          description,
          keywords,
          dateCreate: new Date(),
          dateUpdate: new Date()
        }
      })

      const candidates = await Galaxy.find({ keywords: { 
        $in: prepared.map(c => c.keywords)
      } })

      prepared = prepared.filter(item => !candidates.find(cand => cand.keywords === item.keywords))

      await Galaxy.insertMany(prepared)

      return res.status(200).json({ message: 'Successfylly saved!' })
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Invalid clustering cache saving' })
    }
  }

  async otherClustersPreparing(req, res) {
    try {
      const { ids } = req.body

      if (ids.length === 0) return res.status(200).json({ clusters: [] })

      const { data } = await axios
        .post(`${process.env.PYTHON_SERVER}/prepare/other/clusters`, { ids })

      if (data.clusters.length) {
        const clusterCache = new ClusterCache({
          hash: data.hash,
          clusters: data.clusters,
          dateCreate: new Date(),
          dateUpdate: new Date()
        })
  
        await clusterCache.save()
      }

      return res.status(200).json({ ...data })
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Invalid clustering' })
    }
  }

  async checkCache(req, res) {
    try {
      const { ids } = req.body

      if (ids.length === 0) return res.status(200).json([])

      const data = await axios
        .post(`${process.env.PYTHON_SERVER}/prepare/check_cache`, { ids })

      if (!data.data) return res.status(200).json([])

      const clustering = data.data.clustering

      return res.status(200).json(clustering)
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Invalid clustering' })
    }
  }

  async checkGalaxies(req, res) {
    try {
      const { clusters } = req.body

        setTimeout(() => {
          const result = clusters.map((cluster => {
            const item = {
              id: cluster.id,
              topic: 'Medicine',
              description: 'This topic explores the advancements in surgical techniques and practices that have emerged over the years within hospital settings. It delves into the critical role of doctors, particularly surgeons, in pioneering and adopting innovative procedures to enhance patient outcomes.'
            }

            return item
          }))

          return res.status(200).json({ clusters: result })
        }, 15000)

      if (ids.length === 0) return res.status(200).json({ clusters: [] })

      const { data } = await axios
        .post(`${process.env.PYTHON_SERVER}/prepare/other/clusters`, { ids })

      return res.status(200).json({ ...data })
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Invalid clustering' })
    }
  }

  async getDescriptions(req, res) {
    try {
      const { clusters } = req.body

      const { data } = await axios
        .post(`${process.env.COMPUTING_SERVER}/api/content/clusters-description`, { clusters })

      return res.status(200).json({ ...data })
    } catch (error) {
      console.log(error);
      const message = error?.response?.data.message || 'Server functional error. Try to check your entries.'
      return res.status(400).json({ message })
    }
  }
}

module.exports = new ClusterController()