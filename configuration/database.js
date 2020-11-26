const crypto = require('crypto').randomBytes(256).toString('hex'); // Provides cryptographic functionality (OpenSSL's hash, HMAC, cipher, decipher, sign and verify functions)

module.exports = {
    uri: 'mongodb://localhost:27017/Master',
    secret: crypto,
    db: 'Master',
    options: {
        "auth": { "authSource": "admin" },
        useNewUrlParser: true,
        useFindAndModify: false,
        user: "master",
        pass: "m@st3r.passw0rd"
        
      }
};