import mongoose from "mongoose";

// @ts-ignore
const codeSchema = mongoose.Schema( {
    userId : {type : String, required : true},
    code : {type : String, required : true}
} )

const Code = mongoose.model( "Code", codeSchema )

export default Code