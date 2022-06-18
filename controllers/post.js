/** requirements **/
const { response, request } = require('express')

/** Local requirements **/
const Post = require('../models/posts')
const User = require('../models/users')
const Service = require('../models/services')

const { sendEmails } = require('../helpers/sendEmail')
const {
    extensionValidation,
    uploadCloudinary,
    deleteFileCloudinary,
    filePostValidation,
} = require('../helpers/upload')

// Se encarga de obtener los posts de un servicio.
const getPosts = async (req = request, res = response) => {
    try {
        const { idService } = req.params
        const posts = await Post.find({ idService })
        res.json({ success: true, posts: posts.reverse() })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}

//Se encarga de actualizar un determinado post del sistema.
const putPost = async (req = request, res = response) => {
    try {
        //Verificamos que el usuario es el dueño del servicio.
        const { id } = req.params
        const service = await Post.findById(id).populate('idService')

        if (service && service.idService.idUser == req.uid) {
            //Quitamos los elementos que no pueden ser actualizados.
            const { idService, ...rest } = req.body

            //Si desea actualizar la foto, la eliminamos de cloudinary y la subimos nuevamente.
            if (req.files && Object.keys(req.files).length != 0) {
                //extension Validation
                try {
                    await filePostValidation(req)
                    await extensionValidation(req)
                } catch (error) {
                    return res.status(400).json({ success: false, msg: error })
                }

                const post = await Post.findById(id)

                deleteFileCloudinary(post.photo)

                const urls = await uploadCloudinary(req, res)
                rest.photo = urls[0]
            }

            //Actualizamos el post.
            const postUpdated = await Post.findByIdAndUpdate(id, rest, {
                new: true,
            })

            return res.json({
                success: true,
                post: postUpdated,
            })
        }

        res.json({
            success: false,
            msg: 'The user is not the bussiness director',
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, msg: 'Contact with the admin' })
    }
}
//Se encarga de eliminar un post del sistema.
const deletePost = async (req = request, res = response) => {
    try {
        //Verificamos que el usuario es el dueño del servicio
        const { id } = req.params
        const post = await Post.findById(id).populate('idService')

        if (post && post.idService.idUser == req.uid) {
            //Eliminamos la foto de cloudinary.
            deleteFileCloudinary(post.photo)
            //Eliminamos el post.
            await Post.findByIdAndDelete(id)

            return res.json({
                success: true,
                msg: 'post deleted',
            })
        }

        res.json({
            success: false,
            msg: 'The user is not the bussiness director',
        })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}
//Se encarga de añadir un nuevo post al sistema.
const postPost = async (req = request, res = response) => {
    try {
        const { id: idService } = req.params
        const { caption, description } = req.body

        //Verificamos que el usuario es el dueño del servicio.
        const correct = await Service.findOne({
            _id: idService,
            idUser: req.uid,
        })

        if (correct) {
            //extension Validation
            try {
                await filePostValidation(req)
                await extensionValidation(req)
            } catch (error) {
                return res.status(400).json({ success: false, msg: error })
            }

            //Subimos la foto a cloudinary.
            const urls = await uploadCloudinary(req, res)

            //guardamos el post.
            const post = new Post({
                caption,
                photo: urls[0],
                description,
                idService,
            })

            await post.save()

            //Mandamos un correo a los usuarios que esten suscritos al servicio.
            const users = await User.find({
                followServices: {
                    $in: [idService],
                },
                postNotifications: true,
            }).select('email -_id')

            const toEmail = users.map((user) => {
                return user.email
            })

            if (toEmail.length != 0) {
                sendEmails({
                    subject: `Nuevo post del servicio ${correct.serviceName}`,
                    toEmail: toEmail,
                    text: `El servicio ${correct.serviceName} ha establecido un post que te puede interesar`,
                    header: 'Nuevo POST',
                })
            }

            return res.json({
                success: true,
                post,
            })
        }

        res.status(400).json({
            success: false,
            msg: 'the user is not the bussiness owner',
        })
    } catch (error) {
        res.status(400).json({ success: false, msg: 'Contact with the admin' })
    }
}

module.exports = {
    postPost,
    putPost,
    getPosts,
    deletePost,
}
