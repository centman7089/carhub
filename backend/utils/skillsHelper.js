// utils/skillHelper.js
import Skill from "../models/Skill.js";

export const getSkillIdsByNames = async (skillNames) => {
  const skills = [];

  for (const name of skillNames) {
    let skill = await Skill.findOne({ name });
    if (!skill) {
      // Add new skill if not found (custom skill)
      skill = await Skill.create({ name, category: "Custom" });
    }
    skills.push(skill._id);
  }

  return skills;
};
