const express = require('express')
const bodyParser = require('body-parser');
var cors = require('cors');
const app = express()
const port = 3000
var mongo = require("./db/mongo");
var logger = require("./db/logger");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

//INIT MONGODB IF not existing
//Populate DB
mongo.populateMongoDB();

app.get('/courses', (req,res,next) => { logger.log('info',createLogJsonReq(req)); next(); }, function (req,res) {
    //console.log(req)
    res.setHeader('Content-Type', 'application/json');
    if(req.query.hasOwnProperty("rating")){
        return mongo.findCoursesWithRating(req,res);
    }else if(req.query.hasOwnProperty("tag")){
        return mongo.findCoursesWithTag(req,res);
    }else if(req.query.hasOwnProperty("difficulty")){
        return mongo.findCoursesWithDifficulty(req,res);
    }else{
        return mongo.findAll(req,res);
    }
});

app.get('/courses/tags/top10', (req,res,next) => { logger.log('info',createLogJsonReq(req)); next(); }, function (req,res) {
    console.log('/courses/tags')
    res.setHeader('Content-Type', 'application/json');
    return mongo.findCountOfTags(req,res);
});

// NEEDS TO BE LAST OTHERWISE THE CALLS ALWAYS POINT AT THIS
app.get('/courses/:id', (req,res,next) => { logger.log('info',createLogJsonReq(req)); next(); }, function (req,res) {
    console.log('/courses/:id')
    res.setHeader('Content-Type', 'application/json');
    return mongo.findById(req,res);
});

app.delete('/courses/:id', (req,res,next) => { logger.log('info',createLogJsonReq(req)); next(); },function (req,res) {
    console.log('/courses/:id')
    res.setHeader('Content-Type', 'application/json');
    return mongo.deleteById(req,res);
});

app.put('/courses/:id', (req,res,next) => { logger.log('info',createLogJsonReq(req)); next(); }, function (req,res) {
    console.log('PUT /courses/:id')
    res.setHeader('Content-Type', 'application/json');
    return mongo.updateById(req,res);
});

app.post('/courses', (req,res,next) => { logger.log('info',createLogJsonReq(req)); next(); }, function (req,res) {
    console.log('POST /courses/')
    res.setHeader('Content-Type', 'application/json');
    return mongo.addDocument(req,res);
});

function createLogJsonReq(req){
    let request = {
        headers: req.headers,
        url: req.originalUrl,
        body: req.body
    }
    return JSON.stringify(request);
}


const server = app.listen(port, () => console.log(`MongoDB API ready and listening at http://localhost:${port}`))
