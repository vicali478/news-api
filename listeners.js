// radioListeners.js
const Datastore = require('nedb-promises');
const listenersDB = Datastore.create({ filename: './db/listeners.db', autoload: true });

module.exports = listenersDB;
