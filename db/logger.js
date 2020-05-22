const { createLogger, transports, format } = require('winston');
require('winston-mongodb');

const logger = createLogger({
    transports: [
        new transports.MongoDB({
            level: 'error',
            db: "mongodb://admin:password@localhost:27017/",
            options: {useUnifiedTopology: true },
            collection: "courses_log",
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

module.exports = logger;
