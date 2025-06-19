// @ts-nocheck
import express from "express";
import passport from "passport"

const authRouter = express.Router()

//@route GET /api/auth/google
authRouter.get( "/google", passport.authenticate( "google", { scope: [ "profile", "email" ] } ) )

authRouter.get( "/google/authenticate", passport.authenticate( "google", {
    successRedirect: "http://localhost:5000/dashboard",
     failureRedirect: "http://localhost:5000/login"
} ) )

export default authRouter