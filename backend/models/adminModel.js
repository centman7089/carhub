import mongoose from "mongoose";

const adminSchema = new  mongoose.Schema( {
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: Number,
        required: true,
    },
    email: {
        type: Number,
        required: true,
    },
    password: {
        type: Number,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    role: {

    }
}, { timestamps: true } )

const Admin = mongoose.models || mongoose.model( "Admin", adminSchema )

export default Admin