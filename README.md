To run the mongodb dokcer image:

docker run -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password -e MONGO_INITDB_DATABASE=coursera --name mongodb -d mongo