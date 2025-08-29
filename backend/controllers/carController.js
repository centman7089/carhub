// const Car = require('../models/Car');

// exports.createCar = async (req, res) => {
//   try {
//     const car = await Car.create(req.body);
//     res.status(201).json(car);
//   } catch (err) {
//     res.status(400).json({ error: 'Car creation failed', err });
//   }
// };

// exports.getCars = async (req, res) => {
//   const cars = await Car.find();
//   res.json(cars);
// };
