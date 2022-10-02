const jwt = require('jsonwebtoken')

function generateAccessToken(id, username, email, roles, user) {
  const payload = Object.assign( { id, username, email, roles }, user )

  return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '7d' })
}

function getUserByToken(authorization) {
  const token = authorization.split(' ')[1]
  
  const user = jwt.verify(token, process.env.SECRET_KEY)

  return user
}

module.exports = { generateAccessToken, getUserByToken }