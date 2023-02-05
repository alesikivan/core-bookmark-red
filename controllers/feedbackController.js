const { validationResult } = require('express-validator')
const { getUserByToken } = require('../helpers/functions')
const Feedback = require('../models/Feedback')

class FeedbackController {
  async feedbackCreate(req, res) {
    try {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({message: 'Invalid data', errors})
      }

      const user = getUserByToken(req.headers.authorization)

      const {
        topic,
        description
      } = req.body

      const feedback = new Feedback({
        topic,
        description,
        author: user.id
      })

      await feedback.save()
      
      return res.status(200).json({ feedback, message: 'Feedback was successfully created!' })
    } catch (error) {
      console.log(error)
      return res.status(400).json({message: 'Server feedback functional error. Try to check your entries.'})
    }
  }
}

module.exports = new FeedbackController()