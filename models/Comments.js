const {Schema,model} = require('mongoose');

const Comments = new Schema({
    idService:{
        type:Schema.Types.ObjectId,
        ref:'Service',
        required:true
    },

    replyTo:[{
        type:Schema.Types.ObjectId,
        ref:'ReplyComment'
    }],

    author:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    text:{
        type:String,
        required:true
    },

    status:{
        type:Boolean,
        default:true
    }
    
})

Comments.methods.toJSON = function(){
    const {__v,_id,status,...comments} = this.toObject();
    comments.uid = _id;
    return comments;

}

module.exports = model('Comments',Comments);