const express = require('express')
const bodyParser = require('body-parser');
var cors = require('cors');
const app = express()
const port = 3000
var mongo = require("./db/mongo");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

//INIT MONGODB IF not existing
//Populate DB
mongo.populateMongoDB();


app.get('/courses', function (req,res) {
    console.log('/courses')
    return mongo.findAll(req,res);
});

//  req.query.params: rating
app.get('/courses/rating', function (req,res) {
    console.log('/courses/rating')
    return mongo.findRatingAbove(req,res);
});

app.get('/courses/tag', function (req,res) {
    console.log('/courses/tag')
    return mongo.findCoursesWithTag(req,res);
});
//  req.query.params: difficulty
app.get('/courses/level', function (req,res) {
    console.log('/courses/level')
    return mongo.findCoursesWithLevel(req,res);
});

// NEEDS TO BE LAST OTHERWISE THE CALLS ALWAYS POINT AT THIS
app.get('/courses/:id', function (req,res) {
    console.log('/courses/:id')
    return mongo.findById(req,res);
});

const server = app.listen(port, () => console.log(`MongoDB API ready and listening at http://localhost:${port}`))
