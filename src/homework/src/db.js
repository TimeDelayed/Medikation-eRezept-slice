// getting-started.js
const mongoose = require("mongoose");
// const Kitty = require('schema/Kitty.schema')

const main = async () => {
  const db = await mongoose.connect("mongodb://root:example@localhost:27017/");
  console.log(db);

  const kittySchema = new mongoose.Schema({
    name: String,
    age: Number,
    isCool: Boolean,
    favouriteTreatd: Array,
    bestToys: [{
      name: String,
      color: String,
    }],
  });

  // NOTE: methods must be added to the schema before compiling it with mongoose.model()
  kittySchema.methods.speak = function speak() {
    const greeting = this.name
      ? "Meow name is " + this.name
      : "I don't have a name";
    console.log(greeting);
  };

  const Kitten = mongoose.model("Kitten", kittySchema);

  const silence = new Kitten({ name: "Silence" });
  console.log(`Silence Name: ${silence.name}`);

  const fluffy = new Kitten({ name: "fluffy" });
  fluffy.speak();

  const r = await fluffy.save();
  fluffy.speak();
  console.log(`With Id: ${r}`);

  const kittens = await Kitten.find();
  console.log(`Kittens: ${kittens}`);

  await Kitten.find({ name: /^fluff/ });
};

try {
  main();
} catch(e) {
  console.log(e);
}
