// @ts-nocheck
// import api from "../routes/userRoutes.js"
import swaggerAutogen from "swagger-autogen"

const outputFile = "./swagger-output.json"; // output file

// const endpointsFiles = "../routes/userRoutes.js" 
const endpointsFiles = [ "./server.js" ] //

swaggerAutogen( outputFile, endpointsFiles ).then( () => (
    console.log("swagger documentation generated")
    
    
))