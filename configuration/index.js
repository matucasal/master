if (process.env.NODE_ENV === 'test') {
  module.exports = {
    JWT_SECRET: 'codeworkrauthentication',
    oauth: {
      google: {
        clientID: 'number',
        clientSecret: 'string',
      },
      facebook: {
        clientID: 311138349468667,
        clientSecret: 'bc628a63863080d8e11024aeaf3c1bd0',
      },
    },
  };
} else {
  module.exports = {
    JWT_SECRET: 'cara de nada',
    oauth: {
      google: {
        clientID: '1',
        clientSecret: '1',
      },
      facebook: {
        clientID: 311138349468667,
        clientSecret: 'bc628a63863080d8e11024aeaf3c1bd0',
      },
    },
  };
}
