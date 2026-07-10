import mongoose from "mongoose";

import { Schema } from "mongoose";

const patientSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: true, 
        index: true
    },
    name: {
        family: {
            type: String,
            required: true
        },
        given: {
            type: [String],
            required: true,
        },
    },
    gender: {
        type: String,
        required: true,
    },
    fullUrl: {
        type: String,
        required: true,
    }
})

export default patientSchema