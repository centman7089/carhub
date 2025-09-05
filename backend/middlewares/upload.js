// @ts-nocheck
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

// ✅ Allowed file types (images + PDF)
const allowedDocTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// ✅ File filter for documents (images OR PDF)
const fileFilter = (req, file, cb) => {
  if (allowedDocTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, WEBP images or PDF files are allowed!"), false);
};

// ✅ Cloudinary storage for identity documents
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === "application/pdf";
    return {
      folder: "identity-documents",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
      resource_type: "auto", // ⚡ auto-detect (handles image/pdf)
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      ...(isPDF
        ? {} // No image transformation for PDFs
        : {
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto:best" },
            ],
          }),
    };
  },
});

// ✅ Cloudinary storage for vehicle images (unchanged)
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

// ✅ Multer uploader for documents
const uploadDocuments = multer({
  storage: documentStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max for docs
});

// ✅ Multer uploader for vehicles
const vehicleImages = multer({
  storage: carStorage,
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed for vehicles!"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).fields([
  { name: "mainImage", maxCount: 1 },
  { name: "supportingImages", maxCount: 10 },
]);

export { uploadDocuments, vehicleImages };
