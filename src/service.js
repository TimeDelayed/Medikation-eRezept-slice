import express from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { readFileSync } from 'node:fs'

//setup
const app = express()
const port = 3000
app.use(express.json())

const publicKey = readFileSync('./public.key')
const privateKey = readFileSync('./private.key')

// verifies the JWT token and adds the user to the request object
const securityMiddleware = async (req, res, next) => {
  try {
    const tokenSplit = req.headers?.authorization?.split(' ')
    const token = tokenSplit?.[1]
    if (tokenSplit?.[0] !== 'Bearer') throw Error('No baerer keyword found')

    req.user = jwt.verify(token, publicKey, { algorithms: ['RS256'] })
    console.log(req.user)
  } catch (e) {
    console.log(e)
    return res.status(401)
  }

  next()
}

// https://www.npmjs.com/package/jsonwebtoken
// https://medium.com/@almog_y/creating-and-reading-jwt-tokens-in-node-js-dd2202363327
const handleDummyLogin = (req, res) => {
  const {username, password} = req.body

  if (username !== 'admin' || password !== 'admin') {
    return res.status(401).json({error: 'Invalid credentials'})
  }

  const user = {username}
  const token = jwt.sign(user, privateKey, { expiresIn: '60d',  algorithm: 'RS256'});
  console.log('Generated JWT token:', token);

  return res.status(200).json({ token: token })

}



const handleNewMedication = (req, res) => {
  // console.log(req.params)
  // console.log(req.query)
  // console.log(req.body.medication)

  // console.log(req.user)
  // if (req.user?.claims?.includes('medication:create')) {
  //   return res.status(401)
  // }

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
