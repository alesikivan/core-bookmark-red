const jwt = require('jsonwebtoken')

module.exports = function (roles) {
  return function (req, res, next) {
    if (req.method === 'OPTION') next()

    try {
      const token = req.headers.authorization.split(' ')[1]
  
      if (!token) {
        return res.status(403).json({message: 'User not registered!'})
      }

      // Check roles
      const { roles: userRoles } = jwt.verify(token, process.env.SECRET_KEY)
      let hasRole = false
      userRoles.forEach(role => {
        if (roles.includes(role))
          hasRole = true        
      })

      if (!hasRole) {
        return res.status(403).json({message: 'You do not have an access!'})
      }

      next()
    } catch (error) {
      console.log(error)
      return res.status(403).json({message: 'User not registered!'})
    }
  }
}