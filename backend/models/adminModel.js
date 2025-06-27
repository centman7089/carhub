import mongoose from "mongoose";

const adminSchema = new  mongoose.Schema( {
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    role
        : {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin',
    },
    isVerified: {
        type: Boolean,
        default: false,
      },
    emailCode: String,
    emailCodeExpires: Date,
    resetCode: String,
    resetCodeExpires: Date,
    verificationToken: String,
    passwordHistory: [
      {
        password: String,
        changedAt: Date
      }
    ]
}, { timestamps: true } )

const Admin = mongoose.model( "Admin", adminSchema )

export default Admin