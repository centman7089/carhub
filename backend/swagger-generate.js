// @ts-nocheck
// import api from "../routes/userRoutes.js"
import swaggerAutogen from "swagger-autogen"

const doc = {
    info: {
      title: 'InnoTech API',
      description: 'API documentation for the InnoTech platform',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://page-inno-tech.onrender.com',
        description: 'Production Render Server'
      }
    ],
  };

const outputFile = "./swagger-output.json"; // output file

// const endpointsFiles = "../routes/userRoutes.js" 
const endpointsFiles = [ "./server.js" ] //

swaggerAutogen( outputFile, endpointsFiles,doc ).then( () => (
    console.log("swagger documentation generated")
    
    
))