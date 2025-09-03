// @ts-nocheck

// const cloudinary = require( "../utils/cloudinary" );
import cloudinary from "../utils/cloudinary.js";
// @ts-nocheck

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";


import mongoose from "mongoose";
import User from "../models/userModel.js";
import Vehicle from "../models/Vehicle.js";
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const uploadToCloudinary = async (fileBuffer, filename) => {
  return await cloudinary.uploader.upload_stream({
    folder: "vehicles",
    public_id: filename.split(".")[0],
    resource_type: "image",
  }, (err, result) => {
    if (err) throw err;
    return result;
  }).end(fileBuffer);
};


// CREATE NEW VEHICLE
const createVehicle = async (req, res) => {
  try {
    // Check if file size error occurred
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }

    // Check for multer errors (file too large, etc.)
    if (req.files && req.files.length === 0 && req.body.images) {
      return res.status(400).json({
        success: false,
        message: "File upload failed - file may be too large or invalid format"
      });
    }

    const {
      make,
      model,
      year,
      vin,
      bodyType,
      fuelType,
      transmission,
      price,
      mileage,
      color,
      condition,
      lotNumber,
      description,
      features,
      zipCode,
      address,
      state,
      city
    } = req.body;

    // Validation
    if (!make || !model || !year || !vin || !price) {
      return res.status(400).json({
        success: false,
        message: "Make, model, year, VIN, and price are required",
      });
    }

    // ✅ Handle images
    let mainImage = "";
    let supportingImages = [];

    if (req.files && req.files.length > 0) {
      mainImage = req.files[0].path; // first image = cover photo
      supportingImages = req.files.slice(1).map((file) => file.path); // rest of images
    }

    const vehicle = await Vehicle.create({
      make,
      model,
      year,
      vin,
      bodyType,
      fuelType,
      transmission,
      price,
      mileage,
      color,
      condition,
      lotNumber,
      description,
      features: features
        ? Array.isArray(features)
          ? features
          : features.split(",").map((f) => f.trim())
        : [],
      mainImage,
      supportingImages,
      zipCode,
      address,
      state,
      city,
    });

    res.status(201).json({
      success: true,
      message: "✅ Vehicle created successfully",
      vehicle,
    });
  } catch (error) {
    console.error("❌ Error creating vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: error.message,
    });
  }
};

// Get all vehicles with optional search
const getVehicles = async (req, res) => {
  try {
    const query = {};

    if (req.query.make) query.make = new RegExp(req.query.make, "i");
    if (req.query.year) query.year = req.query.year;
    if (req.query.model) query.model = new RegExp(req.query.model, "i");

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.status(200).json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single vehicle
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Not found" });
    res.status(200).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Not found" });

    const imageUrls = [...vehicle.images];

    if (req.files?.length) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload_stream(
          {
            folder: "vehicles",
            resource_type: "image",
          },
          (error, result) => {
            if (result?.secure_url) imageUrls.push(result.secure_url);
          }
        ).end(file.buffer);
      }
    }

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        features: req.body.features || [],
        images: imageUrls,
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  const createVehicle = async (req, res) => {
//   // Immediately set response timeout and headers for large requests
//   req.setTimeout(300000); // 5 minutes timeout
//   res.setHeader('X-Request-Timeout', '300000');

//   try {
//     // Check if request is too large before processing
//     const contentLength = parseInt(req.headers['content-length'] || '0');
//     if (contentLength > 50 * 1024 * 1024) { // 50MB limit
//       return res.status(413).json({
//         success: false,
//         message: "Request payload too large. Maximum size is 50MB."
//       });
//     }

//     // Process multipart form data as stream
//     if (req.is('multipart/form-data')) {
//       await processMultipartStream(req, res);
//     } else {
//       // Handle JSON-only requests
//       await processJsonBody(req, res);
//     }
//   } catch (error) {
//     console.error("❌ Error creating vehicle:", error);
    
//     if (error.code === 'ETIMEDOUT') {
//       return res.status(408).json({
//         success: false,
//         message: "Request timeout - file upload took too long"
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: "Failed to create vehicle",
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };

// // Stream-based multipart form data processing
// const processMultipartStream = async (req, res) => {
//   return new Promise(async (resolve, reject) => {
//     let formData = {
//       fields: {},
//       files: {}
//     };

//     // Simulate multipart parsing with streams
//     let currentField = '';
//     let buffer = '';

//     req.on('data', (chunk) => {
//       buffer += chunk.toString();
      
//       // Simple multipart parsing (in real scenario, use busboy or similar)
//       const boundary = '--' + req.headers['content-type'].split('boundary=')[1];
//       const parts = buffer.split(boundary);
      
//       buffer = parts.pop() || ''; // Keep incomplete part in buffer
      
//       for (const part of parts) {
//         if (part.includes('filename=')) {
//           // File part - handle with stream
//           processFilePart(part, formData);
//         } else {
//           // Field part
//           processFieldPart(part, formData);
//         }
//       }
//     });

//     req.on('end', async () => {
//       try {
//         // Process remaining buffer
//         if (buffer.trim() && !buffer.includes('--')) {
//           processFieldPart(buffer, formData);
//         }

//         // Validate required fields
//         const validationError = validateVehicleFields(formData.fields);
//         if (validationError) {
//           return reject(validationError);
//         }

//         // Create vehicle with stream-processed data
//         const vehicle = await createVehicleFromStreamData(formData);
        
//         res.status(201).json({
//           success: true,
//           message: "✅ Vehicle created successfully",
//           vehicle,
//         });
//         resolve();
//       } catch (error) {
//         reject(error);
//       }
//     });

//     req.on('error', reject);
//   });
// };

// const processFilePart = (part, formData) => {
//   const headersEnd = part.indexOf('\r\n\r\n');
//   if (headersEnd === -1) return;

//   const headers = part.substring(0, headersEnd);
//   const content = part.substring(headersEnd + 4);
  
//   const nameMatch = headers.match(/name="([^"]+)"/);
//   const filenameMatch = headers.match(/filename="([^"]+)"/);
  
//   if (nameMatch && filenameMatch) {
//     const fieldName = nameMatch[1];
//     const filename = filenameMatch[1];
//     const fileId = uuidv4();
//     const filePath = path.join('uploads', `${fileId}-${filename}`);
    
//     // Write file stream
//     const writeStream = createWriteStream(filePath);
//     writeStream.write(content);
//     writeStream.end();
    
//     if (!formData.files[fieldName]) {
//       formData.files[fieldName] = [];
//     }
//     formData.files[fieldName].push({
//       filename,
//       path: filePath,
//       size: content.length
//     });
//   }
// };

// const processFieldPart = (part, formData) => {
//   const headersEnd = part.indexOf('\r\n\r\n');
//   if (headersEnd === -1) return;

//   const headers = part.substring(0, headersEnd);
//   const content = part.substring(headersEnd + 4).trim();
  
//   const nameMatch = headers.match(/name="([^"]+)"/);
//   if (nameMatch) {
//     formData.fields[nameMatch[1]] = content;
//   }
// };

// const validateVehicleFields = (fields) => {
//   const { make, model, year, vin, price } = fields;
  
//   if (!make || !model || !year || !vin || !price) {
//     return new Error("Make, model, year, VIN, and price are required");
//   }
  
//   return null;
// };

// const createVehicleFromStreamData = async (formData) => {
//   const { fields, files } = formData;
  
//   let mainImage = "";
//   let supportingImages = [];

//   if (files?.mainImage?.[0]) {
//     mainImage = files.mainImage[0].path;
//   }
//   if (files?.supportingImages?.length > 0) {
//     supportingImages = files.supportingImages.map(f => f.path);
//   }

//   return await Vehicle.create({
//     make: fields.make,
//     model: fields.model,
//     year: parseInt(fields.year),
//     vin: fields.vin,
//     bodyType: fields.bodyType,
//     fuelType: fields.fuelType,
//     transmission: fields.transmission,
//     price: parseFloat(fields.price),
//     mileage: fields.mileage ? parseInt(fields.mileage) : 0,
//     color: fields.color,
//     condition: fields.condition,
//     lotNumber: fields.lotNumber,
//     description: fields.description,
//     features: fields.features
//       ? Array.isArray(fields.features)
//         ? fields.features
//         : fields.features.split(",").map(f => f.trim())
//       : [],
//     mainImage,
//     supportingImages,
//     zipCode: fields.zipCode,
//     address: fields.address,
//     state: fields.state,
//     city: fields.city,
//   });
// };



 const createVehicleWithBusboy = (req, res) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10 // Max 10 files
      }
    });

    const formData = {
      fields: {},
      files: {}
    };

    bb.on('field', (name, value) => {
      formData.fields[name] = value;
    });

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const fileId = uuidv4();
      const filePath = path.join('uploads', `${fileId}-${filename}`);
      
      if (!formData.files[name]) {
        formData.files[name] = [];
      }

      const fileData = {
        filename,
        path: filePath,
        size: 0
      };

      const writeStream = createWriteStream(filePath);
      
      file.on('data', (chunk) => {
        fileData.size += chunk.length;
      });

      file.pipe(writeStream);
      
      file.on('end', () => {
        formData.files[name].push(fileData);
      });
    });

    bb.on('finish', async () => {
      try {
        const validationError = validateVehicleFields(formData.fields);
        if (validationError) {
          return reject(validationError);
        }

        const vehicle = await createVehicleFromStreamData(formData);
        
        res.status(201).json({
          success: true,
          message: "✅ Vehicle created successfully",
          vehicle,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    bb.on('error', reject);
    
    req.pipe(bb);
  });
};



export {createVehicle, getVehicleById, getVehicles, updateVehicle, deleteVehicle, createVehicleWithBusboy}