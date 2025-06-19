import mongoose, { Document, Schema } from "mongoose";
import { ProviderEnum } from "../enums/account-provider.enum";

// export interface AccountDocument extends Document {
//   provider: ProviderEnumType;
//   providerId: string; // Store the email, googleId, facebookId as the providerId
//   userId: mongoose.Types.ObjectId;
//   refreshToken: string | null;
//   tokenExpiry: Date | null;
//   createdAt: Date;
// }

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      required: true,
    },
    providerId: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: { type: String, default: null },
    tokenExpiry: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.refreshToken;
      },
    },
  }
);

const Account = mongoose.model("Account", accountSchema);
export default Account;
