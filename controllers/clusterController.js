const { default: axios } = require("axios")

class ClusterController {
  async clustersPreparing(req, res) {
    try {
      const { ids } = req.body

      if (ids.length === 0) return res.status(200).json({ clusters: [] })

      const { data } = await axios
        .post(`${process.env.PYTHON_SERVER}/prepare/clusters`, { ids })

      return res.status(200).json({ ...data })
    } catch (error) {
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