import agenda from "./utils/schedule";
import redisClient from "./utils/redisHelper";
import path from "path";
import eventEmitter from "./utils/event";
import authRoute from "./components/userAuth";
import userRoute from "./components/users";
import adminRoute from "./components/admin";
import corsOptions from "./utils/corsOptions";
import { NextFunction, Request, Response } from "express";
import moment from "moment";
import { mkdir } from "fs";

var morgan = require('morgan');

const config = require("config")
const mongoose = require('mongoose');
const express = require('express')
const bodyParser = require('body-parser')
const cors = require("cors");
const cookieParser = require("cookie-parser");
require('dotenv').config()


const userMap: any = {};
const userMapMobile: { [key: string]: string } = {}
let connectedUsers: any = {};

process.on('uncaughtException', (error, origin) => {
    console.log('----- Uncaught exception -----')
    console.log(error)
    console.log('----- Exception origin -----')
    console.log(origin)
})

process.on('unhandledRejection', (reason, promise) => {
    console.log('----- Unhandled Rejection at -----')
    console.log(promise)
    console.log('----- Reason -----')
    console.log(reason)
})

express.application.prefix = express.Router.prefix = function (path: any, configure: any) {
    var router = express.Router();
    this.use(path, router);
    configure(router);
    return router;
};

const app = express()
app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
// app.use(cors(corsOptions))
app.use(cookieParser());

app.use(express.json({limit : '50mb'}))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(express.static(path.join(__dirname, 'components/admin/public')));
app.set('views', path.join(__dirname, 'components/admin/views'));
app.set('view engine', 'ejs');

app.use('/uploads', express.static(path.join(__dirname, '/uploads')))

app.use(morgan('dev', { skip: (req: any, res: any) => process.env.NODE_ENV === 'production' }));
app.set('eventEmitter', eventEmitter)

app.prefix('/user', (route: any) => {
    authRoute(route)
    userRoute(route)
})



app.prefix('/admin', (route: any) => {
    adminRoute(route)
})


const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

server.listen(config.get("PORT"), () => {
    console.log(`⚡️[NodeJs server]: Server is running at http://localhost:${config.get("PORT")}`)

    mongoose.connect(
        config.get("DB_CONN_STRING"),
        () => console.log('connected to mongodb.')
    );
    redisClient.on('error', (err: any) => console.log('Redis Client Error', err));
    // io.on('connection', connectionHandler);

    agenda.start().then(() => {
        console.log(`⏳ agenda is started`);
    }).catch(() => console.log(`🛑 agenda is not started`));
    
    // let saTime = moment(Date.now()).subtract(210,'minutes').format('hh:mm A');
    // if(saTime === "08:00 PM"){

    // }
    
    

});

export {
    io, userMap,
    userMapMobile,
    connectedUsers,

}
//  "ROUTE_URL": "http://192.168.0.156:7009",