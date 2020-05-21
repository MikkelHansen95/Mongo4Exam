const { MongoClient, ObjectID } = require('mongodb');

var mongoClient = MongoClient(
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

async function deleteById(req, res) {
    let id = req.params.id;
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.findOneAndDelete({
        _id: id
    }, {});
    console.log(result);
    return res.status(200).send(JSON.stringify({ message: "Successful deleted"}));
}

async function updateById(req, res) {
    let id = req.params.id;
    let body = req.body;
    console.log(body)
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.findOneAndUpdate({
        _id: id
    }, {
        $set: body
    }, {});
    console.log(result)
    return res.send(JSON.stringify(result));
}

async function addDocument(req, res) {
    let body = req.body;
    if(!body.hasOwnProperty("_id")){
        let newObjectId = new ObjectID().toHexString();
        body['_id'] = newObjectId;
    }

    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    try{
        let cursor = await collection.insertOne(body)
        console.log(cursor)
        return res.send(JSON.stringify(cursor.ops[0]));
    }catch(e){
        console.log(e.code);
        if(e.code == 11000){
            return res.status(400).send({error: "Duplicate key for _id field"});
        }else{
            return res.status(400).send({error: "Something went wrong"});
        } 
    }
}

async function findAll(req, res) {
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.find();
    return res.send(JSON.stringify(await result.toArray()));
}

async function findRatingAbove(req, res) {
    let compareRating;
    //console.log(req.params.rating)
    if(req.params.rating.includes(",")){
        compareRating = req.params.rating.replace(",",".");
    }else{
        compareRating = req.params.rating;
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

async function findCoursesWithRating(req, res) {
    console.log('/courses?rating')
    let compareRating;
    let comparator;
    if(req.query.rating.includes("<")) {
        compareRating = req.query.rating.replace("<","").replace(",",".");
        comparator = false;
    } else {
        compareRating = req.query.rating.replace(">","").replace(",",".");
        comparator = true;
    }
    console.log(typeof compareRating, compareRating);
    var compareRatingFloat = Number(compareRating);
    console.log(compareRatingFloat);
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let resultCursor
    try{
        if(comparator){
            resultCursor =await collection.find({ Rating: { $gt: compareRatingFloat } })
        }else{
            resultCursor = await collection.find({ Rating: { $lt: compareRatingFloat } })
        }
        let result = await resultCursor.toArray();
        result.sort( (a,b) => {
            return b.Rating - a.Rating;
        })
        return res.send(JSON.stringify(await result));
    }catch(e) {
        return res.status(500).send({ message: "Error try again"});
    }

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

async function findCoursesWithDifficulty(req, res) {
    let level = req.query.difficulty;
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.find({ Difficulty: level });
    let resu = await result.toArray();
    console.log(await resu.length)
    return res.send(JSON.stringify(await resu));
}

async function findCountOfTags(req, res) {
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.mapReduce(
        function() { 
            for (let i = 0; i < this.Tags.length; i++) {
                var tag = this.Tags[i];
                emit(tag, 1);
            }
        },
        function (key, values) { 
            var count = 0;
            for (let i = 0; i < values.length; i++) {
                count += values[i];
            }
            return count;
        },
        {out: {inline: 1} }
        );
        result.sort( (a,b) => {
            return b.value - a.value;
        })
    return res.send(JSON.stringify(await result.slice(0,10)));
}


module.exports = {
    populateMongoDB: populateMongoDB,
    findById: findById,
    findAll: findAll,
    findCoursesWithTag: findCoursesWithTag,
    findCoursesWithDifficulty: findCoursesWithDifficulty,
    deleteById: deleteById,
    updateById: updateById,
    addDocument: addDocument,
    findCountOfTags: findCountOfTags,
    findCoursesWithRating: findCoursesWithRating
};