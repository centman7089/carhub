import User from "../models/userModel.js"


const requestCode = (req, res) => {
    const {email} = req.body

    if(!email){
        return res.status(404).json({
            message : "Missing field: User Email is required",
        })
    }

    User.find({email : email})
    .then(user => {
       if(user.length >= 1){
            var code = generateCode()
            var saveCode = new User({
                code: code,
                userId: user[0]._id
            })
            saveCode = saveCode.save()

            if(saveCode){
                var send = sendEmailverify(email, user[0].firstname, code);
                return res.status(200).json({
                    message : `Verification Code has been sent to ${email}`,
                })
            }
        }
       else{
        res.status(404).json({
            message : "User does not exist"
        })
       }
    })
    .catch(err => {
        res.status(500).json({
            error : err
        })
    })
}

const requestPasswordCode = (req, res) => {
    const {email} = req.body

    if(!email){
        return res.status(404).json({
            message : "Missing field: User Email is required",
        })
    }

    User.find({email : email})
    .then(user => {
       if(user.length >= 1){
            var code = generateCode()
            var saveCode = new User({
                code: code,
                userId: user[0]._id
            })
            saveCode = saveCode.save()

            if(saveCode){
                var send = sendPasswordReset(email, user[0].firstname, code);
                return res.status(200).json({
                    message : `Password Reset Code has been sent to ${email}`,
                })
            }
        }
       else{
        res.status(404).json({
            message : "User does not exist"
        })
       }
    })
    .catch(err => {
        res.status(500).json({
            error : err
        })
    })
}

const verifyPasswordReset = (req, res) => {
    User.find({"code" : req.body.code})
    .then(data => {
        if(data.length == 0){
            return res.status(400).json({
                message : "Invalid code",
            })
        }

        if( req.body.userId != data[0].userId){
            return res.status(400).json({
                message : "Invalid code",
            })
        }

        User.findOneAndUpdate({_id : req.body.userId}, {password: req.body.password})
        .then(() => {
            User.findOneAndDelete({"code" : req.body.code})
            .then( codeRes => {
                return res.status(200).json({
                    message : "Password Reset Successfully"
                })
            })
       })
    })
    .catch(err => {
        res.status(500).json({
            message : err
        })
    })
}


const resetPassword = async (req, res) => {
	try {
	  const { token } = req.params;
	  const { password } = req.body;
  
	  const user = await User.findOne({
		resetCode: token,
		resetCodeExpires: { $gt: Date.now() },
	  });
  
	  if (!user) {
		return res
		  .status(400)
		  .json({ success: false, message: "Invalid or expired reset token" });
	  }
  
	  //update password
	  const hashedPassword = await bcryptjs.hash(password, 10);
  
	  user.password = hashedPassword;
	  user.resetCode = undefined;
	  user.resetCodeExpires = undefined;
	  await user.save();
  
	  // await sendResetSuccessEmail(user.email)
  
	  res
		.status(200)
		.json({ success: true, message: "Password reset successful" });
	} catch (error) {
	  console.log("Error in reset password ", error);
	  res.status(400).json({ success: false, message: error.message });
	}
  };