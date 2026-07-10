import mongoose from "mongoose";

const { Schema } = mongoose;

const comments = new Schema({

    body: {
        type: String,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },

}, { _id: false })

const blogSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    Comments: {
        type: [comments],
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    meta: {
        votes: {
            type: Number,
            default: 0
        },
        stars: {
            type: Number,
            default: 0
        },
        favs: {
            type: Number
        }
    }
}
);

blogSchema.add({
    test: {
        type: String,
        default: "test5"
    }
})

blogSchema.methods.print = function print() {
    const print = `${this.title} ${this.body} ${this.date}`;
    console.log(print);
};

blogSchema.statics.findByTitle = function (title) {
    return this.find({ title: new RegExp(title, 'i') });
};


export default blogSchema