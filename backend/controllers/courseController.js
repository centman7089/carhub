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
import Course from "../models/Course.js"
// GET /api/courses/intern-count
const getInternsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const interns = await InternProfile.find({ selectedCourses: courseId })
      .populate("user", "firstName lastName profilePic email")
      .select("headline location user");

    const formattedInterns = interns.map(profile => ({
      fullName: `${profile.user.firstName} ${profile.user.lastName}`,
      profilePic: profile.user.profilePic,
      email: profile.user.email,
      headline: profile.headline,
      location: profile.location,
      internId: profile.user._id
    }));

    res.status(200).json({
      course: course.name,
      courseId,
      count: formattedInterns.length,
      interns: formattedInterns
    });
  } catch (err) {
    console.error("Error fetching interns by course:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export {getInternsByCourse}
// export {getSkillsByCourse, addCourseSkills, getAllCourses}