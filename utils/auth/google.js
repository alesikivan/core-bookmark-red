const passport = require('passport')
const {Strategy: GoogleStrategy } = require('passport-google-oauth20')

const User = require("../../models/User")
const userController = require('../../controllers/userController')

passport.use(
  new GoogleStrategy(
    {
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      const id = profile.id
      const email = profile.emails[0].value
      const firstName = profile.name.givenName
      const lastName = profile.name.familyName
      const profilePhoto = profile.photos[0].value
      const fullName = profile.displayName

      const candidate = await userController.getByEmail(email)

      if (!candidate) {
        const user = await userController.addGoogleUser({
          id,
          email,
          firstName,
          lastName,
          profilePhoto,
          fullName
        })

        return done(null, user)
      }

      // Skip user which logged by differect option and have the same email
      if (candidate.source != "google") {
        return done(null, false, { message: `You have previously signed up with a different signin method` })
      }

      candidate.lastVisited = new Date()
      return done(null, candidate)
    }
  )
);