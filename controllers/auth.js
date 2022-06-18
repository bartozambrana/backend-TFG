const bcryptjs = require('bcryptjs')
const { request, response } = require('express')

const createJWT = require('../helpers/createJWT')

const User = require('../models/users')

/* Documented */
const login = async (req = request, res = response) => {
    const { email, password } = req.body

    try {
        //Verificamos que el usuario exista mediante el email
        const user = await User.findOne({ email }).populate({
            path: 'followServices',
            select: 'serviceName',
        })
        //NO existe un usuario con dicho email
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'email incorrect',
            })
        }
        //En el caso de que si exista el usuario verificamos su estado en el sistema.
        if (!user.status) {
            return res.status(400).json({
                success: false,
                msg: 'status:false',
            })
        }
        //Verificamos la constraseña, viendo si coinciden la encriptación.
        const validPassword = bcryptjs.compareSync(password, user.password)
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'password incorrect',
            })
        }
        //Creamos el JWT, para mantener las comunicaciones entre el cliente y el servidor.
        token = await createJWT(user.id)

        res.json({
            success: true,
            user,
            token,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Talk to the administrator',
        })
    }
}

module.exports = {
    login,
}
