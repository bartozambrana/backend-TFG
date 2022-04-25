const Post = require("../models/posts");
const Work = require("../models/works");
const Comment = require("../models/Comments");
const ReplyComment = require("../models/ReplyComment");
const Dates = require("../models/dates");
const deleteServiceElements = async(id) =>{
    //Delete service Works.
    const workList = await Work.find({idService:id});
    for(const work of Object.values(workList)){
        for(photo of work.photos){
            deleteFileCloudinary(photo);
        }

        await Work.findByIdAndDelete(work.id);
    }
    //Delete service Posts
    const postList = await Post.find({idService:id});
    for(const post of Object.values(postList)){
        deleteFileCloudinary(post.photo);
        await Post.findByIdAndDelete(post.id);
    }

    //Delete Comments
    const commentList = await Comment.find({idService:id})
    for(const comment of Object.values(commentList)){
        const replies = await Comment.findByIdAndUpdate(comment.id,{status:false},{new:true});
        for (reply of replies.replyTo)
            await ReplyComment.findByIdAndUpdate(reply.id,{status:false});
    }

    //Delete Appointments
    await Dates.find({idService:id}).update({status:false});

    //Delete Service in followServices Users.
    await User.find({
        $pull: {followServices: id}
    });

}

module.exports = deleteServiceElements;