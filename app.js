require('dotenv').config();

const Server = require('./models/server');

const server = new Server();
//Corremos el servidor.
server.listen();