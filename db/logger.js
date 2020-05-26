const { createLogger, transports, format } = require('winston');
require('winston-mongodb').MongoDB;

const logger = createLogger({
    transports: [
        new transports.MongoDB({
            db: "mongodb://admin:password@localhost:27017/coursera",
            options: {useUnifiedTopology: true },
            collection: "courses_log",
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

module.exports = logger;
