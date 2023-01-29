const jwt = require('jsonwebtoken')

function generateAccessToken(id, username, email, roles, user) {
  const payload = Object.assign( { id, username, email, roles }, user )

  return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '7d' })
}

function getUserByToken(authorization) {
  const token = authorization.split(' ')[1]
  
  try {
    const user = jwt.verify(token, process.env.SECRET_KEY)
    return user
  } catch (error) {
    return false
  }
}

module.exports = { generateAccessToken, getUserByToken }