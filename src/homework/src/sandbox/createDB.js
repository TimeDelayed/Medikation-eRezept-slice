import mongoose from "mongoose";
import blogSchema from "./testSchema.js";

console.log(blogSchema)

main().catch(err => console.log(err));

async function main() {
    const db = await mongoose.connect('mongodb://root:example@localhost:27017/');
    console.log(db)

    const Blog = mongoose.model('Blog', blogSchema)
    console.log(Blog)

    const Blogs = await Blog.find();

    const newBlog = new Blog({
        title: "myBlog",
        date: Date.now(),
        year: 2024,
        body: "This is my blog.",
        Comments:
            [{
                body: "test1",
                userId: 1
            },
            {
                body: "test2",
                userId: 2
            }],
        meta: {
            favs: 20
        }
    })

    const newBlog2 = new Blog({
        title: "test2",
        date: Date.now(),
        year: 1999,
        body: "This is my blog.",
        Comments:
            [{
                body: "test1",
                userId: 1
            },
            {
                body: "test2",
                userId: 2
            }],
        meta: {
            favs: 20
        }
    })

    console.log(`BlogName: ${newBlog.title}`)

    console.log(newBlog)
    const savedBlog = await newBlog.save();
    const savedBlog2 = await newBlog2.save();
    console.log(JSON.stringify(savedBlog, null, 2));
    console.log(savedBlog2)

    savedBlog.print();

    const test2 = await Blog.find({ title: "test2" })
    console.log("test2")
    console.log(test2)

    const test3 = await Blog.findByTitle("test")
    console.log("testfind")
    console.log("=========")
    console.log(test3)
    console.log("=========")


    console.log(`IsBlog Empty?: ${Blogs.length === 0}`)

}
