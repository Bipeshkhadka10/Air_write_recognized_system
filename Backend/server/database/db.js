const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URL = process.env.MONGO_URL ||  'mongodb://localhost:27017/air_write_system';

mongoose.connect(MONGODB_URL);
const db = mongoose.connection;

db.on('connected',()=>{console.log('Connected to Database MongoDB')});
db.on('disconnected',()=>{console.log('Connected to Database MongoDB Fialed')});
db.on('error',(error)=>{console.log('Error connecting to MongoDB',error)});


// .then(()=>{
// console.log("database connected successfully")})
//.catch((err)=>{
//  console.log('database connection filed',err)};
// ); 
// 

module.exports = db;