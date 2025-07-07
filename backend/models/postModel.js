// models/postModel.js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    text: {
      type: String,
      maxlength: 500,      // lowercase = correct validator key
    },
    img: String,
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: { type: String, required: true },
        userProfilePic: String,
        username: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
