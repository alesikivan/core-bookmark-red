require('dotenv').config()
require('./utils/auth/passport')
require('./utils/auth/google')

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const passport = require("passport")
const session = require('express-session');

const authRouter = require('./routers/authRouter')
const groupRouter = require('./routers/groupRouter')
const userRouter = require('./routers/userRouter')
const listRouter = require('./routers/listRouter')
const resourceRouter = require('./routers/resourceRouter')
const searchRouter = require('./routers/searchRouter')

const app = express()

app.use(express.json())
app.use(cors())
app.use(passport.initialize())

app.use(
  session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
)

app.get('/', (req, res) => res.send('Hello world'))

app.use('/auth', authRouter)
app.use('/group', groupRouter)
app.use('/user', userRouter)
app.use('/list', listRouter)
app.use('/resource', resourceRouter)
app.use('/search', searchRouter)

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await mongoose.connect(process.env.DB_CONN)
    app.listen(PORT, () => {
      console.log(`Success server has started on port ${PORT}`)
    })
  } catch (e) {
    console.log(e)
  }
}

startServer()
