const { Schema, model } = require('mongoose')

const Post = Schema({
    caption: {
        type: String,
        required: true,
    },
    photo: {
        //base64
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    idService: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    serviceName: {
        type: String,
        required: false,
    },
})

Post.methods.toJSON = function () {
    const { __v, _id, ...post } = this.toObject()
    post.uid = _id
    return post
}

module.exports = model('Post', Post)
