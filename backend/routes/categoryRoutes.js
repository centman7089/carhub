// @ts-nocheck
import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,getCategoryByName
} from "../controllers/categoryController.js";

const router = express.Router();

// Public
router.get( "/", getCategories );
// GET /api/categories/name/:name
router.get("/name/:name", getCategoryByName);

router.get("/:id", getCategoryById);

// Admin (you can protect with middleware later)
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
