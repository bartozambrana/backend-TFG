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
        //realiza la petición el mismo que quiere borrarlo.
        const user = await User.findById(req.uid).populate({
            path: 'followServices',
            select: 'serviceName',
        })
        let services = []

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

/* Documented */
const putUser = async (req = request, res = response) => {
    const { password, ...rest } = req.body
    try {
        //if user want to change the password
        if (password) {
            const salt = bcryptjs.genSaltSync()
            rest.password = bcryptjs.hashSync(password, salt)
        }

        //update user.
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
        //Verify fields.
        const { password, email, userName, type } = req.body

        //Create the user instance
        const user = new User({ userName, email, password, type })

        //Encrypt password.
        const salt = bcryptjs.genSaltSync()
        user.password = bcryptjs.hashSync(password, salt)

        //Save user in DataBase.
        await user.save()

        //Obtenemos la información del body.
        res.json({
            success: true,
            user,
        })
    } catch (error) {
        res.status(500).json({ status: false, msg: 'contact with the adming' })
    }
}

/* Documented */
const deleteUser = async (req = request, res = response) => {
    try {
        //realiza la petición el mismo que quiere borrarlo.
        const user = await User.findByIdAndUpdate(req.uid, { status: false })

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

/* We obtain random content from works and posts for the given user */
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
        //Obtain services followed by the user.
        let { followServices: followedServices } = await User.findById(
            req.uid
        ).select('followServices -_id')

        followedServices = followedServices.map((service) => service._id)

        //Variable post.
        let posts = []
        //Obtain three posts from follow services
        posts = await Posts.find({
            _id: { $nin: servedPosts },
            idService: { $in: followedServices },
        })
            .sort({ id: -1 })
            .limit(1)

        //Add currenty posts served.
        posts.map((element) => servedPosts.push(element.id))

        let amount = 2
        if (followedServices.length === 0) amount = 5

        // The rest of posts from random services.
        posts.push(
            ...(await Posts.find({
                _id: {
                    $nin: servedPosts,
                },
                idService: { $nin: followedServices },
            })
                .sort({ id: -1 })
                .limit(amount))
        )

        //The same behaviour with works.

        let works = []
        works = await Works.find({
            _id: { $nin: servedWorks },
            idService: { $in: followedServices },
        })
            .sort({ id: -1 })
            .limit(1)

        //Add currenty works served.
        works.map((element) => servedWorks.push(element.id))

        // The rest of posts from random services.
        works.push(
            ...(await Works.find({
                _id: {
                    $nin: servedWorks,
                },
                idService: { $nin: followedServices },
            })
                .sort({ id: -1 })
                .limit(amount))
        )
        let homeContent = works.concat(posts)
        //randomly order
        homeContent.sort(() => Math.random() - 0.5)

        res.json({ success: true, homeContent })
    } catch (error) {
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}

const getRecommendations = async (req = request, res = response) => {
    try {
        const pearson = await recommendedServices(req, res)
        res.json({ success: true, msg: pearson })
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
