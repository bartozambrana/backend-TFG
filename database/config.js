/*
    En este documento se recoge la configuración de la base de datos.
*/
const mongoose = require('mongoose')

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CNN)

        console.log('Base de datos ACTIVADA')
    } catch (error) {
        throw new Error('Error al levantar la base de datos.')
    }
}

module.exports = {
    dbConnection,
}
