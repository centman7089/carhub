// @ts-nocheck
import express from "express";
import { createBodytype, getBodyTypeById, getBodyTypes, updateBodyType, deleteBodyType , getBodyTypeByName} from "../controllers/bodyTypeController.js";


const router = express.Router();

// Public
router.get( "/", getBodyTypes );
// GET /api/bodytypes/name/:name
router.get("/name/:name", getBodyTypeByName);
router.get("/:id", getBodyTypeById);

// Admin (you can protect with middleware later)
router.post("/", createBodytype);
router.put("/:id", updateBodyType);
router.delete("/:id", deleteBodyType);

export default router;
