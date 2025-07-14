// // @ts-nocheck
  
// import CourseSkillMap from "../models/courseSkills.js";

//   const addCourseSkills = async (req, res) => {
//     try {
//       const { course, skills } = req.body;
//       const courseEntry = await CourseSkillMap.findOneAndUpdate(
//         { course },
//         { $addToSet: { skills: { $each: skills } } },
//         { upsert: true, new: true }
//       );
//       res.status(201).json(courseEntry);
//     } catch (err) {
//       res.status(400).json({ message: 'Error saving course skills', error: err.message });
//     }
// };


// const getAllCourses = async (req, res) => {
//   const courses = await CourseSkillMap.find({}, 'course');
//   res.json(courses.map(c => c.course));
// };

// const getSkillsByCourse = async (req, res) => {
//   try {
//     const { course } = req.params;
//     const courseData = await CourseSkillMap.findOne({ course });
//     if (!courseData) return res.status(404).json({ message: 'Course not found' });
//     res.json(courseData.skills);
//   } catch (err) {
//     res.status(400).json({ message: 'Error fetching skills', error: err.message });
//   }
// };

import InternProfile from "../models/internProfile.js";
// GET /api/courses/intern-count
const getInternCountByCourse = async (req, res) => {
  try {
    const result = await InternProfile.aggregate([
      { $unwind: "$selectedCourses" },
      {
        $lookup: {
          from: "courses",
          localField: "selectedCourses",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      { $unwind: "$courseInfo" },
      {
        $group: {
          _id: "$courseInfo.name",
          internCount: { $addToSet: "$user" } // ensures unique interns
        }
      },
      {
        $project: {
          course: "$_id",
          internCount: { $size: "$internCount" },
          _id: 0
        }
      },
      {
        $sort: { internCount: -1 } // optional: sort descending by count
      }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Error fetching course intern count:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export {getInternCountByCourse}
// export {getSkillsByCourse, addCourseSkills, getAllCourses}