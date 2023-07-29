const { check, validationResult } = require('express-validator')

const descriptionGeneratorValidation = [
  check('link', 'Link can not be empty.').notEmpty().trim(),

  (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid data', errors })
    }

    next()
  },
]

module.exports = {
  descriptionGeneratorValidation
}