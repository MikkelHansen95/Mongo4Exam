var mongo = require("mongodb");
var mongoClient = mongo.MongoClient(
    "mongodb://admin:password@localhost:27017",
    { useUnifiedTopology: true }
);
var csvParser = require("./csv_converter");
mongoClient.connect().then(() => {
    console.log("MongoDB connection fully alive")
}).catch((e) => {
    console.log("ERROR: " + e);
})
async function populateMongoDB() {
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let results = csvParser.loadCsv();
    collection.insertMany(await results, function (err, resultDocuments) { console.log("Done populating DB") });
}

async function findById(req, res) {
    let id = req.params.id;
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.findOne({
        _id: id
    }, {});
    return res.send(JSON.stringify(result));
}

async function findAll(req, res) {
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.find();
    return res.send(JSON.stringify(await result.toArray()));
}

async function findRatingAbove(req, res) {
    let compareRating;
    if(req.query.rating.includes(",")){
        compareRating = req.query.rating.replace(",",".");
    }else{
        compareRating = req.query.rating;
    }
    var compareRatingFloat = parseFloat(compareRating);

    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let resultCursor = await collection.find({ Rating: { $gt: compareRatingFloat } })
    let result = await resultCursor.toArray();
    result.sort( (a,b) => {
        return b.Rating - a.Rating;
    })
    return res.send(JSON.stringify(await result));
}

async function findCoursesWithTag(req, res) {
    let tag = req.query.tag;
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.find({ Tags: tag });
    let resu = await result.toArray();
    console.log(await resu.length)
    return res.send(JSON.stringify(await resu));
}

async function findCoursesWithLevel(req, res) {
    let level = req.query.difficulty;
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.find({ Difficulty: level });
    let resu = await result.toArray();
    console.log(await resu.length)
    return res.send(JSON.stringify(await resu));
}



module.exports = {
    populateMongoDB: populateMongoDB,
    findById: findById,
    findAll: findAll,
    findRatingAbove: findRatingAbove,
    findCoursesWithTag: findCoursesWithTag,
    findCoursesWithLevel: findCoursesWithLevel
};