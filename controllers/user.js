/** requirements - thrid party **/
const { response, request } = require('express')
const bcryptjs = require('bcryptjs')

/** Local requirements **/
const User = require('../models/users')
const Service = require('../models/services')
const deleteServiceElements = require('../helpers/deleteService')
const Posts = require('../models/posts')
const Works = require('../models/works')
const { recommendedServices } = require('../helpers/recommendation')

const getUser = async (req = request, res = response) => {
    try {
        //Obtenemos los datos del usuario.
        const user = await User.findById(req.uid).populate({
            path: 'followServices',
            select: 'serviceName',
        })
        let services = []
        //Obtenemos los servicios que son propiedad del usuario.
        if (user.type) services = await Service.find({ idUser: req.uid })

        res.json({
            user,
            services,
            success: true,
        })
    } catch (error) {
        res.status(500).json({
            msg: `contact with the admin`,
            success: false,
        })
    }
}

//El usiario desea actualizar los datos del mismo.
const putUser = async (req = request, res = response) => {
    const { password, ...rest } = req.body
    try {
        //Si el usuario quiere cambiar la contraseña, la ciframos previamente.
        if (password) {
            const salt = bcryptjs.genSaltSync()
            rest.password = bcryptjs.hashSync(password, salt)
        }

        //Actualizamos los datos del usuario.
        const user = await User.findByIdAndUpdate(req.uid, rest, { new: true })

        res.json({
            success: true,
            user,
        })
    } catch (error) {
        res.status(500).json({ status: false, msg: 'contact with the adming' })
    }
}

/* Documented */
const postUser = async (req = request, res = response) => {
    try {
        const { password, email, userName, type } = req.body

        //Creamos la instacia del usuario.
        const user = new User({ userName, email, password, type })

        //Encrypt password.
        const salt = bcryptjs.genSaltSync()
        user.password = bcryptjs.hashSync(password, salt)

        //Guardamos el suauiro.
        await user.save()

        //Mandamos el usuario.
        res.json({
            success: true,
            user,
        })
    } catch (error) {
        res.status(500).json({ status: false, msg: 'contact with the adming' })
    }
}

//El usuario desea darse de baaja.
const deleteUser = async (req = request, res = response) => {
    try {
        //realiza la petición el mismo que quiere borrarlo.
        const user = await User.findByIdAndUpdate(req.uid, { status: false })
        //Damos de baja las servicios del usuario si los pasee.
        if (user.type) {
            const services = await Service.find({ idUser: user.id })
            for (const service of Object.values(services))
                await deleteServiceElements(service.id)
        }

        res.json({
            msg: `user with ${req.uid} deleted`,
            success: true,
        })
    } catch (error) {
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}

/* Se encaga de obtener contenido aleatorio para el usuario.*/
const getRandomContent = async (req = request, res = response) => {
    try {
        let { servedPosts = [], servedWorks = [] } = req.query
        // to array.
        if (servedPosts.length !== 0) {
            servedPosts = servedPosts.split(';')
        }

        if (servedWorks.length !== 0) {
            servedWorks = servedWorks.split(';')
        }
        //Obtenemos los servicio que sigue el usuario.
        let { followServices: followedServices } = await User.findById(
            req.uid
        ).select('followServices -_id')

        followedServices = followedServices.map((service) => service._id)

        //Variable post.
        let posts = []
        //Obtenemos un post del servicio que sigue el usuario.
        posts = await Posts.find({
            _id: { $nin: servedPosts },
            idService: { $in: followedServices },
        })

            .sort({ id: -1 })
            .limit(1)
            .populate('idService', 'serviceName')

        posts = posts.map((post) => {
            let serviceName = post.idService.serviceName

            post.serviceName = serviceName

            post.idService = post.idService._id

            return post
        })

        //Add currenty posts served.
        posts.map((element) => servedPosts.push(element.id))

        let amount = 2
        if (followedServices.length === 0) amount = 5

        // dos post de servicios aleatorios.
        let randomPosts = await Posts.find({
            _id: {
                $nin: servedPosts,
            },
            idService: { $nin: followedServices },
        })
            .sort({ id: -1 })
            .limit(amount)
            .populate('idService', 'serviceName')

        randomPosts = randomPosts.map((post) => {
            post.serviceName = post.idService.serviceName

            post.idService = post.idService._id
            return post
        })

        posts.push(...randomPosts)

        //Lo msimo para el caso de los trabajos.

        let works = []
        works = await Works.find({
            _id: { $nin: servedWorks },
            idService: { $in: followedServices },
        })
            .sort({ id: -1 })
            .limit(1)
            .populate({ path: 'idService', select: 'serviceName' })

        works.map((element) => {
            element.serviceName = element.idService.serviceName
            element.idService = element.idService._id
            return element
        })

        //Add currenty works served.
        works.map((element) => servedWorks.push(element.id))

        // The rest of posts from random services.
        let randomWorks = await Works.find({
            _id: {
                $nin: servedWorks,
            },
            idService: { $nin: followedServices },
        })
            .sort({ id: -1 })
            .limit(amount)
            .populate({ path: 'idService', select: 'serviceName' })

        randomWorks = randomWorks.map((work) => {
            work.serviceName = work.idService.serviceName
            work.idService = work.idService._id
            return work
        })
        works.push(...randomWorks)

        let homeContent = works.concat(posts)
        //establecemos un orden aleatrorio del contenido.
        homeContent.sort(() => Math.random() - 0.5)

        res.json({ success: true, homeContent })
    } catch (error) {
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}
//Método encargado de obtener la recomendación para un determinado usuario.
const getRecommendations = async (req = request, res = response) => {
    try {
        const recommendation = await recommendedServices(req, res)
        res.json({ success: true, recommendation })
    } catch (error) {
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}
module.exports = {
    getUser,
    putUser,
    postUser,
    deleteUser,
    getRandomContent,
    getRecommendations,
}
