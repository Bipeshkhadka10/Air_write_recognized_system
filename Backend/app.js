const express = require('express');
const app = express();
const db = require('./server/database/db')
const userRoute = require('./server/routes/userRoute');
const noteRoute = require('./server/routes/noteRoute');
const cookieParser = require('cookie-parser');
// const { notFound, errorHandler } = require('./server/middleware/errorMiddleWare');
require('dotenv').config();
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:5173',
    credentials:true
}))
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.send('hello world');
})
app.use('/api',userRoute);
app.use('/api',noteRoute);

// custome error middlewares
// app.use(notFound);
// app.use(errorHandler);

app.listen(process.env.PORT ||4000,()=>{
    console.log("Server is running on port 5000");
})