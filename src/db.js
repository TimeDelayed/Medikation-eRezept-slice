import mongoose from 'mongoose'

import Kitty from './schema/Kitty.schema.js'

const main = async () => {
  const db = await mongoose.connect('mongodb://127.0.0.1:27017/test')
  console.log('Connected ...')

  const silence = new Kitty({ name: 'Silence', age: 23.5 })
  const r = await silence.save()
  console.log(r)
}

try {
  main()
} catch (e) {
  console.error(e)
}
