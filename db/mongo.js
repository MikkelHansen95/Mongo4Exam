const { MongoClient, ObjectID, Logger } = require('mongodb');
const ownLogger = require("./logger");

var mongoClient = MongoClient(
    "mongodb://admin:password@localhost:27017/",
    { useUnifiedTopology: true, loggerLevel: 'error'}
);

var csvParser = require("./csv_converter");
mongoClient.connect().then( (client) => {
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
    let result = await collection.find({
        _id: id
    }, {}).toArray();
    console.log(result)
    if(result.length > 0){
        return res.send(JSON.stringify(result[0]));
    }else{
        return res.status(404).send({});
    }
}

async function deleteById(req, res) {
    let id = req.params.id;
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.findOneAndDelete({
        _id: id
    }, {});
    return res.status(200).send(JSON.stringify({ message: "Successful deleted" }));
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
    return res.send(JSON.stringify(result));
}

async function addDocument(req, res) {
    let body = req.body;
    if (!body.hasOwnProperty("_id")) {
        let newObjectId = new ObjectID().toHexString();
        body['_id'] = newObjectId;
    }

    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    try {
        let cursor = await collection.insertOne(body)
        console.log(cursor)
        return res.status(201).send(JSON.stringify(cursor.ops[0]));
    } catch (e) {
        console.log(e.code);
        if (e.code == 11000) {
            return res.status(400).send({ error: "Duplicate key for _id field" });
        } else {
            return res.status(400).send({ error: "Something went wrong" });
        }
    }
}

async function findAll(req, res) {
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.find();
    return res.send(JSON.stringify(await result.toArray()));
}


async function findCoursesWithPrice(req, res) {
    //console.log('/courses?price')
    let comparePrice;
    let comparator;
    if (req.query.price.includes("<")) {
        comparePrice = req.query.price.replace("<", "").replace(",", ".");
        comparator = false;
    } else if(req.query.price.includes(">")){
        comparePrice = req.query.price.replace(">", "").replace(",", ".");
        comparator = true;
    } else {

    }

    var comparePriceFloat = parseFloat(comparePrice);
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let resultCursor;
    try {
        if (comparator) {
            resultCursor = await collection.find({ Price: { $gt: comparePriceFloat } })
        } else {
            resultCursor = await collection.find({ Price: { $lt: comparePriceFloat } })
        }
        let result = await resultCursor.toArray();
        result.sort((a, b) => {
            return b.Price - a.Price;
        })
        return res.send(JSON.stringify(await result));
    } catch (e) {
        return res.status(500).send({ message: "Error try again" });
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

async function findCoursesWithLevel(req, res) {
    let level = req.query.level;
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.find({ Level: level });
    let resu = await result.toArray();
    console.log(await resu.length)
    return res.send(JSON.stringify(await resu));
}

async function findCountOfTags(req, res) {
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let result = await collection.mapReduce(
        function () {
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
        { out: { inline: 1 } }
    );
    result.sort((a, b) => {
        return b.value - a.value;
    })
    return res.send(JSON.stringify(await result.slice(0, 10)));
}

function createLogJson(req,res){
    let request = {
        headers: req.headers,
        path: req.route.methods + " - " + req.route.path,
        url: req.originalUrl,
        body: req.body
    }

    let response = {
        response: res
    }
    return JSON.stringify(request, response);
}


module.exports = {
    populateMongoDB: populateMongoDB,
    findById: findById,
    findAll: findAll,
    findCoursesWithTag: findCoursesWithTag,
    findCoursesWithLevel: findCoursesWithLevel,
    deleteById: deleteById,
    updateById: updateById,
    addDocument: addDocument,
    findCountOfTags: findCountOfTags,
    findCoursesWithPrice: findCoursesWithPrice
};