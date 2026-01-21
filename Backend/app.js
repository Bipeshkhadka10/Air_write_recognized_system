const express = require('express');

const app = express();
const db = require('./server/database/db')
const userRoute = require('./server/routes/userRoute');
const noteRoute = require('./server/routes/noteRoute')
require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.send('hello world');
})
app.use('/api',userRoute);
app.use('/api',noteRoute);

app.listen(process.env.PORT ||4000,()=>{
    console.log("Server is running on port 5000");
})