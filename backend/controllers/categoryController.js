// @ts-nocheck
import Category from "../models/categoryModel.js";

// ✅ Create Category
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    const exists = await Category.findOne({ name }).select("name _id");
    if (exists) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({ name, description, icon });
    res.status(201).json({ success: true, message: "Category created", category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get All Categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get Single Category
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get Category by Name
export const getCategoryByName = async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.params.name });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ✅ Update Category
export const updateCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, icon },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    res.status(200).json({ success: true, message: "Category updated", category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
