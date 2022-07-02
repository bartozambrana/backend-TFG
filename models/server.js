const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const path = require('path')

const { dbConnection } = require('../database/config')

class Server {
    constructor() {
        this.app = express()
        this.port = process.env.PORT
        this.userPath = '/api/users'
        this.authPath = '/api/auth'
        this.servicePath = '/api/services'
        this.postPath = '/api/posts'
        this.workPath = '/api/works'
        this.datePath = '/api/dates'
        this.commentPath = '/api/comments'

        //Conectamos a base de datos.
        this.connectionDB()

        this.middlewares()
        this.routes()
    }

    async connectionDB() {
        await dbConnection()
    }

    middlewares() {
        //Cors.
        this.app.use(cors())

        //Parseo del body. Todo lo que se mande en el body lo serializa a JSON para una
        //mayor facilidad en el tratamiento de la información
        this.app.use(express.json())

        //Upload-files.
        this.app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }))
    }
    //manejador de rutas.
    routes() {
        this.app.use(this.userPath, require('../routes/user'))
        this.app.use(this.authPath, require('../routes/auth'))
        this.app.use(this.servicePath, require('../routes/service'))
        this.app.use(this.postPath, require('../routes/post'))
        this.app.use(this.workPath, require('../routes/work'))
        this.app.use(this.datePath, require('../routes/date'))
        this.app.use(this.commentPath, require('../routes/comment'))

        //Directorio público
        this.app.use(express.static(path.join(__dirname, '../public')))
        this.app.use('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'))
        })
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('Servidor corriendo en el puerto', this.port)
        })
    }
}

module.exports = Server
