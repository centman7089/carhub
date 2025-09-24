// @ts-nocheck
import BodyType from "../models/bodytypeModel.js";

// ✅ Create Category
export const createBodytype = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    const exists = await BodyType.findOne({ name }).select("name _id");
    if (exists) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const bodytype = await BodyType.create({ name, description, icon });
    res.status(201).json({ success: true, message: "BodyType created", bodytype });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get All Categories
export const getBodyTypes = async (req, res) => {
  try {
    const bodytypes = await BodyType.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bodytypes.length, bodytypes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get Single Category
export const getBodyTypeById = async (req, res) => {
  try {
    const bodytype = BodyType.findById(req.params.id);
    if (!bodytype) return res.status(404).json({ success: false, message: "BodyType not found" });
    res.status(200).json({ success: true, bodytype });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Get BodyType by name
export const getBodyTypeByName = async (req, res) => {
  try {
    const bodytype = await BodyType.findOne({ name: req.params.name }); // 👈 search by name

    if (!bodytype) {
      return res.status(404).json({ 
        success: false, 
        message: "BodyType not found" 
      });
    }

    res.status(200).json({ success: true, bodytype });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ✅ Update Category
export const updateBodyType = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const bodytype = await BodyType.findByIdAndUpdate(
      req.params.id,
      { name, description, icon },
      { new: true, runValidators: true }
    );

    if (!bodytype) return res.status(404).json({ success: false, message: "BodyType not found" });

    res.status(200).json({ success: true, message: "BodyType updated", bodytype });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Delete Category
export const deleteBodyType = async (req, res) => {
  try {
    const bodytype = await BodyType.findByIdAndDelete(req.params.id);
    if (!bodytype) return res.status(404).json({ success: false, message: "BodyType not found" });

    res.status(200).json({ success: true, message: "BodyType deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
