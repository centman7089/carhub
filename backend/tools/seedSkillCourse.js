// @ts-nocheck

import mongoose from "mongoose";
import dotenv from "dotenv"
import SkillTools from "../models/skillsTool.js";

dotenv.config();

const seed = async () =>
{
    await mongoose.connect( process.env.MONGO_URI );

    await SkillTools.deleteMany()

    await SkillTools.insertMany( [
        { skills: 'Ux', tools: [ 'Figma', 'Flux', 'Sketch' ] },
        { skills: 'Graphics', tools: [ 'Adobe', 'CorelDraw', 'Photoshop' ] },
        { skills: 'Developer', tools: [ 'ReactJs', 'Java', 'Visual Code Editor' ] },
        { skills: 'CyberSecurity', tools: [ 'Cisco', 'CCNA', 'Pipeline' ] }
    ] );

    console.log( "seeded successfully" );
    process.exit();
    
}
seed();