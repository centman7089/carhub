import mongoose from "mongoose";
import Category from "./models/categoryModel.js";
import BodyType from "./models/bodytypeModel.js";

const categories = [
  "Economy", "Luxury", "Sports", "Electric", "Family", "Commercial",
  "Utility", "Off-road", "Cargo", "Passenger", "Premium", "Performance",
  "Classic", "Budget", "Professional"
];

const bodyTypes = [
  "Sedan", "Hatchback", "SUV", "Crossover", "Coupe", "Convertible",
  "Pickup Truck", "Wagon", "Van", "Truck", "Bus", "Motorcycle",
  "Electric Car", "Classic", "Sports Car", "Off-road", "Luxury Car",
  "Compact Car"
];

async function seedData() {
  await mongoose.connect("mongodb+srv://pageinnovations_db_user:Yj8lP87WkrdhEPtt@carhub.aharkbc.mongodb.net/?retryWrites=true&w=majority&appName=Carhub");

  // Seed categories
  await Category.deleteMany({});
  await Category.insertMany(categories.map(name => ({ name })));

  // Seed bodyTypes
  await BodyType.deleteMany({});
  await BodyType.insertMany(bodyTypes.map(name => ({ name })));

  console.log("✅ Categories & BodyTypes seeded successfully!");
  process.exit();
}

seedData().catch(err => console.error(err));
