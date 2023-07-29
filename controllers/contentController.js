const { default: axios } = require("axios");

class ContentController {
  async descriptionGenerator(req, res) {
    try {
      const {
        link,
        mode = 'DEV_MODE'
      } = req.body

      const { data } = await axios
        .post(`${process.env.COMPUTING_SERVER}/api/content/auto-generate`, { link, mode })

      return res.status(200).json({ ...data })
    } catch (error) {
      console.log(error);
      const message = error?.response?.data.message || 'Server functional error. Try to check your entries.'
      return res.status(400).json({ message })
    }
  }
}

module.exports = new ContentController()