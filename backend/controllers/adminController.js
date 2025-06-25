// @ts-nocheck
import Admin from "../models/adminModel";
import bcrypt from "bcryptjs";

const register = async ( req, res ) =>
{
  try {
    const { firstName, lastName,email, passsword, phone, role } = req.body
    
    const user = Admin.findOne( { email } )
    
    if (!user) {
        return res.json
    }

    const salt = await bcrypt.genSalt( 10 )
      
    const hashedPassword = await bcrypt.hash( password, salt );
    
    const user = new Admin(
        {
            firstName,
            lastName,
            email,
            passsword: hashedPassword
        }
      )
      await user.save()
      return res.status(500).json({success : true,user, msg: "User Created successfully"})
  } catch (error) {
      console.log( error );
      return res.status(500).json({success: false, msg: error.msg})
    
  }

    
}