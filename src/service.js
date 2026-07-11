import express from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

//setup
const app = express()
const port = 3000
app.use(express.json())

const test = process.env.TEST
console.log(test)
const publicKey = process.env.PUBLIC_KEY
console.log(publicKey)
const privateKey = process.env.PRIVATE_KEY
console.log(privateKey)

const securityMiddleware = async (req, res, next) => {
  try {
    console.log(req.user)
    const tokenSplit = req.headers?.authorization?.split(' ')
    const token = tokenSplit?.[1]
    if (tokenSplit?.[0] !== 'Bearer') throw Error('No baerer keyword found')

    req.user = await jwt.verify(token, publicKey)
  } catch (e) {
    console.log(e)
    return res.status(401)
  }

  next()
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

  app.get('/ping', (_, res) => res.json(({ version: '2.13.0' })))

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
