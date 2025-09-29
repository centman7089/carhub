import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer", // could be Intern, Employer, or Buyer/Seller depending on your app
      required: true,
    },
    message: {
      type: String,
      // required: true,
    },
    type: {
      type: String,
      enum: ["general", "auction", "bid", "payment", "system"],
      default: "general",
    },
    read: {
      type: Boolean,
      default: false,
    },
    roleTarget: {
      type: String, // e.g., "admin", "seller", "buyer"
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
