// @ts-nocheck
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const dealerDocumentsSchema = new mongoose.Schema(
  {
    idCardFront: { type: String },
    dealerCertificate: { type: String },
    // tin: { type: String },
    // bankStatement: { type: String },
    cac: { type: String }, // optional
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

const dealerSchema = new mongoose.Schema(
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
    password: { type: String, minLength: 8, required: true },
    phone: { type: String, minLength: 10, required: true },

    // Location
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

    // ✅ Policy acceptance
    acceptedTerms: { type: Boolean, required: true, default: false },
    acceptedPrivacy: { type: Boolean, required: true, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingStage: {
      type: String,
      enum: ["documents", "terms", "admin_review", "completed"],
      default: "documents",
    },

    // Identity Verification
    identityDocuments: { type: dealerDocumentsSchema, default: {} },

    // Verification & approval
    isVerified: { type: Boolean, default: false }, // email verified
    isApproved: { type: Boolean, default: false }, // admin approval
    requiresDocument: { type: Boolean, default: false },

    // // Role
    // role: {
    //   type: String,
    //   enum: ["retailer", "admin", "superadmin", "car_dealer", "retailer"],
    //   default: "retailer",
    // },

    // Status & activity
    loginStatus: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
    lastLogin: { type: Date },

    // Auth utilities
    emailCode: String,
    emailCodeExpires: Date,
    resetCode: String,
    resetCodeExpires: Date,
    verificationToken: String,

    // Track last 5 passwords
    passwordHistory: [
      {
        password: String, // hashed
        changedAt: Date,
      },
    ],

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🔒 Hash password before save
dealerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
dealerSchema.methods.correctPassword = async function (candPwd) {
  return bcrypt.compare(candPwd, this.password);
};

// Generate reset code
dealerSchema.methods.setPasswordResetCode = function () {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  this.resetCode = crypto.createHash("sha256").update(code).digest("hex");
  this.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

// Validate reset code
dealerSchema.methods.validateResetCode = function (code) {
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return (
    hash === this.resetCode &&
    this.resetCodeExpires &&
    this.resetCodeExpires > Date.now()
  );
};

// Reset identity docs if rejected
dealerSchema.methods.resetDocumentsIfRejected = function () {
  if (this.identityDocuments.status === "rejected") {
    this.identityDocuments.status = "pending";
    this.identityDocuments.rejectionReason = undefined;
    this.identityDocuments.reviewedAt = undefined;
    this.onboardingStage = "admin_review";
  }
};

const Dealer = mongoose.model("Dealer", dealerSchema);
export default Dealer;
