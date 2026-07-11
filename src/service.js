import express from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

//setup
const app = express()
const port = 3000
app.use(express.json())

const publicKey = process.env.PUBLIC_KEY
// console.log(publicKey)
const privateKey = process.env.PRIVATE_KEY
// console.log(privateKey)

// verifies the JWT token and adds the user to the request object
const securityMiddleware = async (req, res, next) => {
  try {
    console.log(req.user)
    const tokenSplit = req.headers?.authorization?.split(' ')
    const token = tokenSplit?.[1]
    if (tokenSplit?.[0] !== 'Bearer') throw Error('No baerer keyword found')

    req.user = await jwt.verify(token, privateKey)
  } catch (e) {
    console.log(e)
    return res.status(401)
  }

  next()
}

// https://medium.com/@almog_y/creating-and-reading-jwt-tokens-in-node-js-dd2202363327
const handleDummyLogin = (req, res) => {
  const {username, password} = req.body

  if (username !== 'admin' || password !== 'admin') {
    return res.status(401).json({error: 'Invalid credentials'})
  }

  const answer = "ok"

  const user = {username}
  const token = jwt.sign(user, privateKey, { expiresIn: '1h' });
  console.log('Generated JWT token:', token);

  return res.status(200).json({ token: token })

}



const handleNewMedication = (req, res) => {
  // console.log(req.params)
  // console.log(req.query)
  // console.log(req.body.medication)

  console.log(req.user)
  if (req.user?.claims?.includes('medication:create')) {
    return res.status(401)
  }

  res.status(201).json({ result: 'ok' })
}

const main = async () => {
  const db = await mongoose.connect('mongodb://127.0.0.1:27017/fhir')
  console.log('Connected ...')

  // debug ping
  app.get('/ping', (_, res) => res.json(({ version: '2.13.0' })))

  app.post("/login", handleDummyLogin)

  // security MiddleWare for JWT 
  app.use(securityMiddleware)

  // Privte Endpoints
  app.post('/Patient', handleNewMedication)
  app.post('/Patient/:patientId/medication', handleNewMedication)

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

try {
  main()
} catch (e) {
  console.error(e)
}
