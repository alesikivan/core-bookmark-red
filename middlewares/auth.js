const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
  if (req.method === 'OPTION') next()

  try {
    const token = req.headers.authorization.split(' ')[1]

    if (!token) {
      return res.status(403).json({ message: 'User not registered!' })
    }
    
    const decoded = jwt.verify(token, process.env.SECRET_KEY, (err) => {
      if (err) {
        return res.status(401).json({
          message: 'Session time out. Please login again.'
        }) 
      }
    })

    req.user = decoded
    
    next()
  } catch (error) {
    console.log(error)
    return res.status(403).json({ message: 'User not registered!' })
  }
}