// @ts-nocheck
import mongoose from "mongoose";
import dotenv from "dotenv"
import Course from '../models/Course.js';
import Skill from '../models/Skill.js';

dotenv.config();

const dbUrl = process.env.MONGO_URI || 'mongodb+srv://pageinnovations1234:2nmmLzjqh1233uA4@cluster0.zykhvjj.mongodb.net/Tech_Intern_Main?retryWrites=true&w=majority&appName=Cluster0'
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
    { name: 'AWS', category: 'Cloud' },
    { name: 'Photoshop', category: 'Graphics' },
    { name: 'CorelDraw', category: 'Graphics' },
    { name: 'Figma', category: 'Graphics' }
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
      category: 'Web Development',
      relatedSkills: [
        skills.find(s => s.name === 'JavaScript')._id,
        skills.find(s => s.name === 'React')._id,
        skills.find(s => s.name === 'Node.js')._id,
        skills.find(s => s.name === 'HTML/CSS')._id
      ]
    },
    {
      name: 'Data Science',
      category: 'Data Science',
      description: 'Data science and machine learning',
      relatedSkills: [
        skills.find(s => s.name === 'Python')._id,
        skills.find(s => s.name === 'SQL')._id
      ]
    },
    {
      name: 'DevOps',
      category: 'DevOps',
      description: 'DevOps and cloud computing',
      relatedSkills: [
        skills.find(s => s.name === 'Docker')._id,
        skills.find(s => s.name === 'AWS')._id,
        skills.find(s => s.name === 'Git')._id
      ]
    },
    {
      name: 'Graphics',
      category: 'Graphics',
      description: 'Graphics and Editing',
      relatedSkills: [
        skills.find(s => s.name === 'Photoshop')._id,
        skills.find(s => s.name === 'CorelDraw')._id,
        skills.find(s => s.name === 'Figma')._id
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