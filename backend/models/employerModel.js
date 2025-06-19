// Employer.js

import mongoose from "mongoose";
const EmployerSchema = new mongoose.Schema({
    companyName: String,
    email: String,
    password: String,
    logo: {type: String,
        default: ""},         // uploaded logo
    description: String,
    createdAt: { type: Date, default: Date.now },
    
		lastLogin: {
			type: Date,
			default: Date.now,
		  },
		  isVerified: {
			type: Boolean,
			default: false,
		  },
		  emailCode: String,
		  emailCodeExpires: Date,
		  resetCode: String,
		resetCodeExpires: Date,
		passwordHistory: [
			{
			  password: String,
			  changedAt: Date
			}
		  ]
} );
  
const Employer = mongoose.model( "Employer", EmployerSchema )

export default Employer