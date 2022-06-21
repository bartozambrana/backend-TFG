const Post = require('../models/posts')
const Work = require('../models/works')
const Comment = require('../models/Comments')
const ReplyComment = require('../models/ReplyComment')
const Dates = require('../models/dates')
const User = require('../models/users')
const { deleteFileCloudinary } = require('../helpers/upload')

//Implicaciones de eliminar un servicio del sistema.
const deleteServiceElements = async (id) => {
    //Eliminamos los trabajos del sistema.
    const workList = await Work.find({ idService: id })
    for (const work of Object.values(workList)) {
        for (photo of work.photos) {
            deleteFileCloudinary(photo)
        }

        await Work.findByIdAndDelete(work.id)
    }
    //Eliminamos los posts del sistema
    const postList = await Post.find({ idService: id })
    for (const post of Object.values(postList)) {
        deleteFileCloudinary(post.photo)
        await Post.findByIdAndDelete(post.id)
    }

    //Establecemos los comentarios como no disponibles, al igual que las respuestas.
    const commentList = await Comment.find({ idService: id })
    for (const comment of Object.values(commentList)) {
        const replies = await Comment.findByIdAndUpdate(
            comment.id,
            { status: false },
            { new: true }
        )
        for (reply of replies.replyTo)
            await ReplyComment.findByIdAndUpdate(reply.id, { status: false })
    }

    //Establecemos todas las citas del sistema como ya asignadas, para seguir manteniendo las valoraciones.
    await Dates.find({ idService: id }).update({ status: false })

    //Eliminamos el servicio como seguido de los usuarios.
    await User.find({
        $pull: { followServices: id },
    })
}

module.exports = deleteServiceElements
