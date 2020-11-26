const { createLogger, format, transports, config } = require('winston');
const path = require('path');

var options = {
  file: {
    filename: 'logs/master-server.log',
    //handleExceptions: true,
    json: true,
    maxsize: 50*1024, //50MB
    maxFiles: 10,
    colorize: false,
  }
}

var optionsError = {
  file: {
    level: 'error',
    filename: 'logs/master-error.log',
    //handleExceptions: true,
    json: true,
    maxsize: 50*1024, //50MB
    maxFiles: 10,
    colorize: false,
  }
}

const logger = caller => {
  return createLogger({
    format: format.combine(
      format.label({ label: path.basename(caller) }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(
        info =>
          `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
      )
    ),
    levels: config.syslog.levels,
    transports: [    
      new transports.File(optionsError.file),
      new transports.File(options.file),
      new transports.Console(options.file)
    ]
  });
};

var optionsDB = {
  file: {
    level: 'error',
    filename: 'logs/master-DB.log',
    //handleExceptions: true,
    json: false,
    maxsize: 50*1024, //50MB
    maxFiles: 10,
    colorize: true,
  }
}



module.exports = logger;


