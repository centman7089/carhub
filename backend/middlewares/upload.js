// @ts-nocheck
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinaryModule from 'cloudinary'
import path from "path"

const cloudinary = cloudinaryModule.v2
cloudinary.config( {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.API_SECRET
} )

const allowedResumeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd,openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
]

const allowedImageTypes = [  'image/jpeg',
    'image/png' ]
const resumeStorage = new CloudinaryStorage( {
    cloudinary,
    params: async ( req, file ) =>
    {
        if (!allowedResumeTypes.includes(file.mimetypes)) {
            throw new Error( 'Invalid resume file type' )
            
        }
        return {
            folder: 'intern-uploads/resume',
            public_id: `${Date.now()}-${path.parse(file.originalname).name}`
        }
    }
} )

const photoStorage = new CloudinaryStorage( {
    cloudinary,
    params: async ( req, file ) =>
    {
        if (!allowedImageTypes.includes(file.mimetypes)) {
            throw new Error( 'Invalid image file type' )
            
        }
        return {
            folder: 'intern-uploads/photo',
            public_id: `${Date.now()}-${path.parse(file.originalname).name}`
        }
    }
} )

const resumeUpload = multer( {
    storage: resumeStorage,
    limmits: {fileSize: 5 * 1024 * 1024}
} )

const photoUpload = multer( {
    storage: photoStorage,
    limmits: {fileSize: 5 * 1024 * 1024}
} )

export {resumeUpload, photoUpload}