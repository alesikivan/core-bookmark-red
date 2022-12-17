const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
  if (req.method === 'OPTION') next()

  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Authorization is invalid!' })
    }

    const token = req.headers.authorization.split(' ')[1]

    if (!token) {
      return res.status(403).json({ message: 'User not registered!' })
    }
    
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: 'Session time out. Please login again.',
          code: 401
        })
      }

      req.user = decoded
    
      next()
    })
  } catch (error) {
    console.log(error)
    return res.status(403).json({ message: 'User not registered!' })
  }
}