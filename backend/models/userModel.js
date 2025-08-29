// @ts-nocheck
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
        
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minLength: 6, required: true },
    phone: { type: String, minLength: 6, required: true },

    // Location details
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    streetAddress: { type: String, required: true },
    zipCode: { type: String },

    // Optional profile info
    dateOfBirth: { type: Date },
    profilePic: {
      type: String,
      default:
        "https://res.cloudinary.com/dq5puvtne/image/upload/v1740648447/next_crib_avatar_jled2z.jpg",
    },
    accountType: { type: String, enum: [ 'retailer', 'car_dealer' ], required: true },
    documentUrl: { type: String }, // for car dealers
    document: {
            url: String,
            type: { type: String, enum: ['id_card', 'bank_statement', 'insurance', 'driver_license'] },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    },
    // Verification status
    isVerified: { type: Boolean, default: false },
    requiresDocument: { type: Boolean, default: false },
    verificationStage: {
      type: String,
      enum: ['personalInfo', 'identityDocs', 'terms', 'completed'],
      default: 'personalInfo',
    },

    // Identity document uploads (optional for retailers, required for car dealers)
    // identityDocs: {
    //   driverLicenseUrl: { type: String },
    //   autoInsuranceUrl: { type: String },
    //   bankStatementUrl: { type: String },
    //   otherGovIdUrl: { type: String }, // NIN, voter ID, etc.
    // },

    // Agreement
       // ✅ Policy acceptance fields
       acceptedTerms: { type: Boolean, required: true, default: false },
      acceptedPrivacy: { type: Boolean, required: true, default: false },
      isApproved: { type: Boolean, default: false },
      onboardingCompleted: { type: Boolean, default: false }, // Full flow completed
    //     identityDocuments: {
    //       idCardFront: String,
    //       driverLicense: String,
    //       insurance: String,
    //       bankStatement: String,
    // },
        
  identityDocuments: {
    idCardFront: { type: String },
    driverLicense: { type: String },
    insurance: { type: String },
    bankStatement: { type: String },
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },
    reviewedAt: { type: Date }
},

    // System Roles
    role: {
      type: String,
      enum: ['customer', 'admin', 'delivery', 'support'],
      default: 'customer',
    },

    // Auth utilities
    emailCode: String,
    emailCodeExpires: Date,
    resetCode: String,
    resetCodeExpires: Date,
    vverificationToken: String,
    passwordHistory: [
      {
        password: String,
        changedAt: Date,
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Check password
userSchema.methods.correctPassword = async function (candPwd) {
  return bcrypt.compare(candPwd, this.password);
};

// Set reset code
userSchema.methods.setPasswordResetCode = function () {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  this.resetCode = crypto.createHash("sha256").update(code).digest("hex");
  this.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

// Validate reset code
userSchema.methods.validateResetCode = function (code) {
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return (
    hash === this.resetCode &&
    this.resetCodeExpires &&
    this.resetCodeExpires > Date.now()
  );
};

const User = mongoose.model("User", userSchema);

export default User;
