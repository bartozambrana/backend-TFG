const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require('cors');
const { dbConnection } = require("../database/config");

class Server{
    constructor(){
        this.app = express();
        this.port = process.env.PORT;
        this.userPath = '/api/users';
        this.authPath = '/api/auth';
        this.servicePath = '/api/services';
        this.postPath = '/api/posts';
        this.workPath = '/api/works';
        
        //Conectamos a base de datos.
        this.connectionDB();

        this.middlewares();
        this.routes();

    }

    async connectionDB(){
        await dbConnection();
    }

    middlewares(){
        // De cara al final, para restringir las peticiones únicamente de dicha página.
        // const corsOptions = {
        //     origin: 'https://frontend.com',
        //     optionsSuccessStatus:200
        // }
        // this.app.use(cors(corsOptions))

        //Cors.
        this.app.use(cors());

        //Parseo del body. Todo lo que se mande en el body lo serializa a JSON para una
        //mayor facilidad en el tratamiento de la información
        this.app.use(express.json({limit:'50mb'}));  //limit for json
        this.app.use(express.urlencoded({limit: '50mb',extended:true})) //limit for image data encode
        //Directorio público
        this.app.use( express.static('public'));

        //Upload-files. 
        this.app.use(fileUpload({useTempFiles:true,tempFileDir:'/tmp/'}))
   
        
    }
    //manejador de rutas.
    routes(){
        this.app.use(this.userPath,require('../routes/user'));
        this.app.use(this.authPath,require('../routes/auth'));
        this.app.use(this.servicePath,require('../routes/service'));
        this.app.use(this.postPath,require('../routes/post'));
        this.app.use(this.workPath,require('../routes/work'));
    }

    listen(){
        this.app.listen(this.port, () => {
            console.log('Servidor corriendo en el puerto', this.port);
        });
    }
}

module.exports = Server;