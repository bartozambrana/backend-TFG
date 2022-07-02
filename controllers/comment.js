const { request, response } = require('express')
const Comments = require('../models/Comments')
const Dates = require('../models/dates')
const { findByIdAndUpdate } = require('../models/ReplyComment')
const ReplyComment = require('../models/ReplyComment')
const Service = require('../models/services')

// Se encarga de obtener los comentarios de un servicio o de un usuario o
// los comentarios de un usuario para un determinado servicio.
const getComments = async (req = request, res = response) => {
    const { idService, userComments } = req.query

    try {
        let comments = []
        //Comenntarios de un usuario para un servicio
        if (idService && userComments) {
            comments = await Comments.find({ idService, status: true })
                .populate({
                    path: 'replyTo',
                    match: { author: req.uid, status: true },
                })
                .or({ author: req.uid })
        } else if (idService) {
            // Comentarios de un servicio
            comments = await Comments.find({ idService, status: true })
                .populate({
                    path: 'replyTo',
                    match: { status: true },
                    populate: {
                        path: 'author',
                        select: 'userName serviceName -_id',
                    },
                })
                .populate({ path: 'author', select: 'userName -_id' })
        } else if (userComments) {
            // Comentarios de un usuario
            comments = await Comments.find({ status: true, author: req.uid })
                .populate({ path: 'idService', select: 'serviceName' })
                .populate('replyTo')
        }

        res.json({ success: true, comments })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the amdmin' })
    }
}

// Se encarga de actualizar un comentario, ya sea una respuesta o un comentario
const putComment = async (req = request, res = response) => {
    const { id } = req.params
    const { text } = req.body

    try {
        //Obtengamos el comentario y la respuesta.
        const reply = await ReplyComment.findById(id)
        const comment = await Comments.findById(id)
        let msg = ''
        //En el caso de ser una respuesta.
        if (reply) {
            //Verificamos que el usuario sea o el dueño del servicio o el propio usuario.
            const service = await Service.findById(reply.author)
            if (!service && reply.author != req.uid) {
                return res
                    .status(400)
                    .json({ success: false, msg: 'that comment is not yours' })
            }

            //Actualizamos la respuesta.
            msg = await ReplyComment.findByIdAndUpdate(
                id,
                { text },
                { new: true }
            ).populate({ path: 'author', select: 'serviceName userName -_id' })
        } else if (comment) {
            //Verificamos el dueño del comentario y actualizamos el comentario.
            if (comment.author != req.uid) {
                return res
                    .status(400)
                    .json({ success: false, msg: 'that comment is not yours' })
            }

            msg = await Comments.findByIdAndUpdate(id, { text }, { new: true })
                .populate({ path: 'author', select: 'userName -_id' })
                .populate({ path: 'idService', select: 'serviceName' })
        } else {
            return res
                .status(400)
                .json({ success: false, msg: 'id does not exists' })
        }

        res.json({ success: true, comment: msg })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the amdmin' })
    }
}

//Se encarga de añadir un comentario para un determinado servicio.
const postComments = async (req = request, res = response) => {
    const { id: idService } = req.params
    const { text } = req.body
    try {
        //Verificamos que el dueño del servicio no se esté comentando a si mismo.
        const service = await Service.findById(idService)
        if (service.idUser == req.uid)
            return res.status(400).json({
                success: false,
                msg: 'A bussiness only can put reply not comment to himself',
            })

        //Verificamos que el usuario al menos tenga ya una cita previa..

        //Parallel Queries.
        const [apointments, totalComments] = await Promise.all([
            Dates.find({
                idUser: req.uid,
                date: { $lte: new Date() },
            }),
            Comments.find({ author: req.uid, status: true }),
        ])

        if (apointments.length <= totalComments.length)
            return res.status(400).json({
                success: false,
                msg: 'Only a comment by finished appointment.',
            })

        //Creamos el comentario.
        let comment = new Comments({ idService, author: req.uid, text })
        await comment.save()

        //Mandamos el comentario añadido al sistema
        comment = await Comments.findById(comment.id)
            .populate({ path: 'author', select: 'userName -_id' })
            .populate({ path: 'idService', select: 'serviceName' })

        res.json({ success: true, comment })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'contact with admin' })
    }
}

//Se encarga de añadir la respuesta a un determinado comentario.
const postReplyTo = async (req = request, res = response) => {
    const { id } = req.params
    const { text } = req.body

    try {
        //Obtenemos el comentario.
        const comment = await Comments.findById(id).select('idService -_id')
        //Verificamos si el usuario es el dueño del servicio, en dicho caso establecemos
        //como dueño de la respuesta el propio servicio.
        const service = await Service.findOne({
            id: comment.idService,
            idUser: req.uid,
        })

        let reply = ''
        if (service)
            reply = new ReplyComment({
                text,
                author: service.id,
                propertyModel: 'Service',
            })
        else
            reply = new ReplyComment({
                text,
                author: req.uid,
                propertyModel: 'User',
            })

        await reply.save()
        //Añadimos la respuesta al hilo del comentario.
        await Comments.findByIdAndUpdate(id, { $push: { replyTo: reply.id } })

        reply = await ReplyComment.findById(reply.id).populate({
            path: 'author',
            select: 'serviceName userName -_id',
        })

        res.json({ success: true, reply })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'contact with admin' })
    }
}

//Se encarga de eliminar un comentario o una respuesta a un comentario.
const deleteComments = async (req = request, res = response) => {
    const { id } = req.params

    try {
        const reply = await ReplyComment.findById(id)
        const comment = await Comments.findById(id)
        if (reply) {
            //Verificamos que sea el dueño del comentario.
            const service = await Service.findById(reply.author)
            if (!service && reply.author != req.uid) {
                return res
                    .status(400)
                    .json({ success: false, msg: 'that comment is not yours' })
            }

            //Eliminamos el comentario.
            await ReplyComment.findByIdAndUpdate(id, { status: false })
        } else if (comment) {
            //Verificamos el dueño del comentario.
            if (comment.author != req.uid) {
                return res
                    .status(400)
                    .json({ success: false, msg: 'that comment is not yours' })
            }

            //Eliminamos el comentario.
            const replies = await Comments.findByIdAndUpdate(
                id,
                { status: false },
                { new: true }
            )
            //Establecemos la respuestas de dicho comentario como eliminadas.
            for (reply of replies.replyTo)
                await ReplyComment.findByIdAndUpdate(reply.id, {
                    status: false,
                })
        } else {
            return res
                .status(400)
                .json({ success: false, msg: 'id does not exists' })
        }

        res.json({ success: true, msg: 'comment deleted' })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the amdmin' })
    }
}

module.exports = {
    getComments,
    putComment,
    postComments,
    deleteComments,
    postReplyTo,
}
