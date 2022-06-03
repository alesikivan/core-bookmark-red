const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')
const crypto = require('crypto')

const User = require('../models/User')
const Role = require('../models/Role')
const { generateAccessToken } = require('../helpers/functions')
const userController = require('../controllers/userController')
const sendEmail = require('../utils/auth/mailer')

class authController {
  async register(req, res) {
    try {
      const errors = validationResult(req)
      
      if (!errors.isEmpty()) {
        return res.status(400).json({message: 'Invalid data', errors})
      }

      const { username, email, password } = req.body
      const candidate = await User.findOne({email})

      if (candidate) {
        return res.status(400).json({message: 'User with this email already has created'})
      }

      // Get `User` role from Mongo
      const userRole = await Role.findOne({value: 'USER'})

      // Generate hash by password
      let hash = await bcrypt.hash(password, 7)

      const user = new User({
        username,
        password: hash,
        email,
        roles: [userRole.value]
      })

      await user.save()
      return res.json({message: 'User was successfully registered!'})

    } catch (e) {
      console.log(e)
      res.status(400).json({message: 'Server registration error. Try to check your entries.'})
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body
      const user = await User.findOne({email})

      if (!user) {
        return res.status(400).json({message: `Can not find user with email '${email}'`})
      }

      // Compare the passwords
      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return res.status(400).json({message: `Password is not valid`})
      }
      
      const token = generateAccessToken(
        user._id, 
        user.username, 
        user.email, 
        user.roles, 
        {profilePhoto: user.profilePhoto || ''}
      )
      return res.json({token, message: 'User successfully logged in!'})

    } catch (e) {
      console.log(e)
      res.status(400).json({message: 'Server login error'})
    }
  }

  async forgotPassword(req, res) {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: `Can not find user with email '${email}'` })
    }

    const { resetToken, resetPasswordToken, resetPasswordExpire } = await userController.getResetData()

    user.resetPasswordToken = resetPasswordToken
    user.resetPasswordExpire = resetPasswordExpire

    await user.save({ validaetBeforeSave: false })

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    const message = `Click this link to set a new password: ${resetUrl}`

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset',
        message
      })

      return res.status(200).json({ message: 'Check your emails or spam!' })
    } catch (e) {
      console.log(e)
      user.resetPasswordToken = null
      user.resetPasswordExpire = null

      await user.save({ validaetBeforeSave: false })

      return res.status(400).json({ message: 'Email could not be sent! Check your entry and try again or come back later.' })
    }
  }

  async resetPassword(req, res) {
    const { token, password } = req.body

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({ message: `Invalid token` })
    }

    // Generate hash by password
    let hash = await bcrypt.hash(password, 7)

    // Set new Password
    user.password = hash

    // Clear fields of password reset tokens
    user.resetPasswordToken = null
    user.resetPasswordExpire = null

    await user.save()
    return res.status(200).json({ message: `Successfully password update` })
  }

  async googleAuth(req, res) {
    const user = res.req.user

    const role = await Role.findOne({value: 'USER'})

    // Genetate token => cadasc89cuasdcs9c7s9a7cs9a7csa
    const token = generateAccessToken(
      user.id, user.username, user.email, [role.value], 
      { profilePhoto: user.profilePhoto }
    )

    res.redirect(`${process.env.CLIENT_URL}/auth/google/${token}`)
  }
}

module.exports = new authController()