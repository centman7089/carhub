// @ts-nocheck
import mongoose from "mongoose";


const courseSkillMap = mongoose.Schema( {
    course: { type: String, required: true },
    skills: [ String ],
    
} )

const CourseSkillMap = mongoose.model(' CourseSkillMap', courseSkillMap )

export default CourseSkillMap