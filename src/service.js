import express from 'express'
import mongoose from 'mongoose'
import router from "./routes/index.js";

//setup
const app = express()
const port = 3000
export const fhirBaseUrl = "http://localhost:8080/fhir"
app.use(express.json(), router)

const main = async () => {
  const db = await mongoose.connect('mongodb://127.0.0.1:27017/fhir')
  console.log('Connected ...')

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

try {
  main()
} catch (e) {
  console.error(e)
}
