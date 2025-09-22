// @ts-nocheck
import express from "express";
import { createBodytype, getBodyTypeById, getBodyTypes, updateBodyType } from "../controllers/bodyTypeController";
import { deleteCategory } from "../controllers/categoryController";

const router = express.Router();

// Public
router.get("/", getBodyTypes);
router.get("/:id", getBodyTypeById);

// Admin (you can protect with middleware later)
router.post("/", createBodytype);
router.put("/:id", updateBodyType);
router.delete("/:id", deleteCategory);

export default router;
