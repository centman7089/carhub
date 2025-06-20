// @ts-nocheck
// import api from "../routes/userRoutes.js"
import swaggerAutogen from "swagger-autogen"

const doc = {
  openai: "5.1.1",
    info: {
      title: 'Tec Intern API',
      description: 'API documentation for the Tech Intern platform',
      version: '1.0.0',
  },
  host: "https://page-tech.onrender.com",
  schemes: ['http', 'https'],
  basePath: '/',
  consumes: ['application/json'],
  produces: ['application/json'],
    servers: [
      {
        url: 'https://page-tech.onrender.com',
        description: 'APi for TechIntern'
      }
    ],
  };

const outputFile = "./swagger-output.json"; // output file

// const endpointsFiles = "../routes/userRoutes.js" 
const endpointsFiles = [ "./server.js" ] //

swaggerAutogen( outputFile, endpointsFiles,doc ).then( () => (
    console.log("swagger documentation generated")
    
    
))