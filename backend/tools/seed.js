// @ts-nocheck
import mongoose from "mongoose";
import dotenv from "dotenv"
import Course from '../models/Course.js';
import Skill from '../models/Skills.js';

dotenv.config();

const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/Tech'
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedSkills = async () => {
  const skills = [
    { name: 'JavaScript', category: 'Programming' },
    { name: 'Python', category: 'Programming' },
    { name: 'React', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'HTML/CSS', category: 'Frontend' },
    { name: 'SQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Git', category: 'Tools' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'AWS', category: 'Cloud' }
  ];

  await Skill.deleteMany({});
  const createdSkills = await Skill.insertMany(skills);
  return createdSkills;
};

const seedCourses = async (skills) => {
  const courses = [
    {
      name: 'Web Development',
      description: 'Full stack web development course',
      relatedSkills: [
        skills.find(s => s.name === 'JavaScript')._id,
        skills.find(s => s.name === 'React')._id,
        skills.find(s => s.name === 'Node.js')._id,
        skills.find(s => s.name === 'HTML/CSS')._id
      ]
    },
    {
      name: 'Data Science',
      description: 'Data science and machine learning',
      relatedSkills: [
        skills.find(s => s.name === 'Python')._id,
        skills.find(s => s.name === 'SQL')._id
      ]
    },
    {
      name: 'DevOps',
      description: 'DevOps and cloud computing',
      relatedSkills: [
        skills.find(s => s.name === 'Docker')._id,
        skills.find(s => s.name === 'AWS')._id,
        skills.find(s => s.name === 'Git')._id
      ]
    }
  ];

  await Course.deleteMany({});
  await Course.insertMany(courses);
};

const seedDB = async () => {
  try {
    const skills = await seedSkills();
    await seedCourses(skills);
    console.log('Database seeded successfully');
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();