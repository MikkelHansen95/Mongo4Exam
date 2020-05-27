const { MongoClient, ObjectID, Logger } = require('mongodb');
const assert = require('assert');

var mongoClient = MongoClient(
    "mongodb://admin:password@localhost:27017/",
    { useUnifiedTopology: true, useNewUrlParser: true }
);

var csvParser = require("./csv_converter");

mongoClient.connect().then((client) => {
    console.log("MongoDB connection fully alive")
}).catch((e) => {
    console.log("ERROR: " + e);
})


async function populateMongoDB() {
    try {
        var db = mongoClient.db("coursera");
        var collection = db.collection("courses");
        let results = csvParser.loadCsv();
        collection.insertMany(await results, function (err, resultDocuments) { console.log("Done populating DB") });
    } catch (e) {
        return e;
    }
}

async function findById(req, res) {
    try {
        let id = req.params.id;
        var db = mongoClient.db("coursera");
        var collection = db.collection("courses");
        let result = await collection.find({
            _id: id
        }, {}).toArray();
        
        if (result.length > 0) {
            return res.send(JSON.stringify(result[0]));
        } else {
            return res.status(404).send(JSON.stringify({ message: "No Course with requested id" }));
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send();
    }
}

async function deleteById(req, res) {
    try{
        let id = req.params.id;
        var db = mongoClient.db("coursera");
        var collection = db.collection("courses");
        let result = await collection.findOneAndDelete({
            _id: id
        }, {});
        if(result.value == null){
            return res.status(404).send(JSON.stringify({ message: "No Course with requested id" }))
        }else{
            return res.status(200).send(JSON.stringify({ message: "Successful deleted" }))
        }
    }catch(e){
        return res.status(500).send();
    }
}

async function updateById(req, res) {
    try {
        let id = req.params.id;
        let body = req.body;
        var db = mongoClient.db("coursera");
        var collection = db.collection("courses");
        let result = await collection.findOneAndUpdate({
            _id: id
        }, {
            $set: body
        }, { returnOriginal: false } );
        if(await result.value == null){
            return res.status(404).send( JSON.stringify({message: "No Course with requested id" }))
        }else{
            return res.status(200).send(JSON.stringify(result.value));
        }
    } catch (e) {
        console.log(e)
        return res.status(404).send()
    }
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
        return res.status(201).send(JSON.stringify(await cursor.ops[0]));
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
    try{
        var db = mongoClient.db("coursera");
        var collection = db.collection("courses");
        let result = await collection.find();
        return res.send(JSON.stringify(await result.toArray()));
    }catch(e){
        return res.status(500).send({message: "Server Error"})
    }
}

async function findCoursesWithParams(req,res){
    try{
        var mongo_operator_price = '$ne';
        var mongo_operator_tag = '$ne';
        var mongo_operator_level= '$ne';
        var price = -1
        var tags = []
        var level = []
    
        if(req.query.price != undefined){
            if(req.query.operator == "lessThan"){
                mongo_operator_price = '$lt'
            }else if (req.query.operator == "greaterThan"){
                mongo_operator_price = '$gt'
            }else{
                mongo_operator_price = '$eq'
            }
            price = parseInt(req.query.price)
        }
    
        if(req.query.tags != undefined){
            console.log(req.query.tags)
            let arr = req.query.tags.split(",");
            arr.forEach(element => {
                tags.push(element)
            });
            mongo_operator_tag = '$all'
            console.log(tags)
        }
    
        if(req.query.level != undefined){
            let arr = req.query.level.split(",");
            arr.forEach(element => {
                level.push(element)
            });
            mongo_operator_level = '$in';
        }
        //GET QUERY FOR TESTING IN MONGO ATLAS
        //console.log(   mongo_operator_price + ": " +  price , mongo_operator_tag + ": " + tags.toString()  ,  mongo_operator_level+ ": " + level  )
        var db = mongoClient.db("coursera");
        var collection = db.collection("courses");
        let resultCursor = await collection.find({ $and: [ { price: { [mongo_operator_price]: price } }, { tags: { [mongo_operator_tag]: tags }  }, { level: { [mongo_operator_level]: level } } ] });
        console.log(await JSON.stringify(resultCursor.cursorState.cmd.query) )
        console.log(await resultCursor.cursorState.cmd.query)
        let result = await resultCursor.toArray();
        return res.send(await result);

    }catch(e){
        console.log(e)
    }
}


async function findCoursesWithPrice(req, res) {
    //console.log('/courses?price')
    let comparePrice;
    let comparator;
    if (req.query.price.includes("<")) {
        comparePrice = req.query.price.replace("<", "").replace(",", ".");
        comparator = false;
    } else if (req.query.price.includes(">")) {
        comparePrice = req.query.price.replace(">", "").replace(",", ".");
        comparator = true;
    }

    var comparePriceFloat = parseFloat(comparePrice);
    var db = mongoClient.db("coursera");
    var collection = db.collection("courses");
    let resultCursor;
    try {
        if (comparator) {
            resultCursor = await collection.find({ price: { $gt: comparePriceFloat } })
        } else {
            resultCursor = await collection.find({ price: { $lt: comparePriceFloat } })
        }
        let result = await resultCursor.toArray();
        result.sort((a, b) => {
            return b.price - a.price;
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

function createLogJson(req, res) {
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
    findCoursesWithPrice: findCoursesWithPrice,
    findCoursesWithParams: findCoursesWithParams
};