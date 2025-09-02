import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinaryModule from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Allowed image types
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

// ✅ File filter (images only)
const fileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed!"), false);
};

// ✅ Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "identity-documents", // change folder name if needed
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto:best" },
      ],
    };
  },
} );

// ✅ Cloudinary storage for vehicle images
const carStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "vehicles",
    public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 800, crop: "limit" },
      { quality: "auto:best" },
    ],
  }),
});

// ✅ Multer uploader (multipart form)
const uploadImages = multer({
  storage: imageStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
} );

const vehicleImages = multer({
  storage: carStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
}).array("images", 10); // <-- use "images" field in frontend


export {uploadImages, vehicleImages};
