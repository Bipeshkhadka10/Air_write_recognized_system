const express = require('express');
const app = express();
const db = require('./server/database/db')
const userRoute = require('./server/routes/userRoute');
const noteRoute = require('./server/routes/noteRoute');
const authRoute = require('./server/routes/authRoute.js');
const predictRoute = require('./server/routes/predictRoute');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require("passport");
// const { notFound, errorHandler } = require('./server/middleware/errorMiddleWare');
require('dotenv').config();
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:5173',
    credentials:true
}))
require("./server/config/passport")
app.use(cookieParser());
app.use(express.json());
app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'server/uploads')));
app.use(passport.initialize());

app.get('/', (req, res) => {
    res.send('Air-Write API running');
})

app.use('/api',userRoute);
app.use('/api',noteRoute);
app.use('/api',predictRoute);
app.use('/auth',authRoute);

// custome error middlewares
// app.use(notFound);
// app.use(errorHandler);

app.listen(process.env.PORT ||4000,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})