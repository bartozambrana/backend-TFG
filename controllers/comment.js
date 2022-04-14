const {request,response} = require('express');
const Comments = require('../models/Comments');
const Dates = require('../models/dates');
const { findByIdAndUpdate } = require('../models/ReplyComment');
const ReplyComment = require('../models/ReplyComment');
const Service = require('../models/services');


const getComments = async (req = request, res = response) => {
    const {idService,userComments} = req.body;

    try {
        let comments = [];
        
        if(idService && userComments){
            comments = await Comments.find({idService,status:true}).
                            populate({path:'replyTo',match:{author:req.uid,status:true}})
                            .or({author:req.uid});

        }else if(idService)
            comments = await Comments.find({idService,status:true}).populate({path:'replyTo',match:{status:true}});
        else if(userComments){
            comments = await Comments.find({status:true}).
                            populate({path:'replyTo',match:{author:req.uid,status:true}})
                            .or({author:req.uid});
        }
        
        res.json({success:true,comments});
            
    } catch (error) {
        res.status(500).json({success:false, msg:'contact with the amdmin'});
    }
}


const putComment = async(req = request, res = response) =>{
    const {id} = req.params;
    const {text} = req.body;

    try {
        const reply = await ReplyComment.findById(id);
        const comment = await Comments.findById(id);
        let msg = "";
        if(reply){
            //Verify if the author is him or his businnes.
            const service = await Service.findById(reply.author);
            if((!service) && (reply.author != req.uid)){
                return res.status(400).json({success:false, msg:'that comment is not yours'});
            }

            //update comment
            msg = await ReplyComment.findByIdAndUpdate(id,{text},{new:true});

        }else if(comment){
            //Verify if the author is him or his businnes.
            if(comment.author != req.uid){
                return res.status(400).json({success:false,msg:'that comment is not yours'});
            }

            //update comment
            msg = await Comments.findByIdAndUpdate(id,{text},{new:true});

        }else{
            return res.status(400).json({success:false,msg:'id does not exists'});
        }

        res.json({success:true,comment:msg});

    } catch (error) {
        res.status(500).json({success:false, msg:'contact with the amdmin'});
    }
}


const postComments = async(req = request, res = response) =>{
    const {id:idService} = req.params;
    const {text} = req.body;
    try {
        const service = await Service.findById(idService);
        if(service.idUser == req.uid)
            return res.status(400).json({success:false, msg:'A bussiness only can put reply not comment to himself'});
        
        //Verify that the user have a date pass in the time.
        const currentDate = new Date();
        const time = (currentDate.getHours()*60) + currentDate.getMinutes();

        //Parallel Queries.
        const [apointments,totalComments] = await Promise.all([
            Dates.find({
                idUser:req.uid,
                date:{$lte:currentDate},
                endHour:{$lte:time} 
            }),
            Comments.find({idUser:req.uid,status:true})
        ])
        
        if(apointments.length <= totalComments.length)
            return res.status(400).json({success:false,msg:'Only a comment by date.'})
       
        //Create Comment Object.
        const comment = new Comments({idService,author:req.uid,text});
        await comment.save();


        res.json({success:true,comments:comment});
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with admin'});
    }
}

/* Documented */
const postReplyTo = async(req = request, res=response) => {

    const{id} = req.params;
    const{text} = req.body;
    
    try {
        const comment = await Comments.findById(id).select('idService -_id');
        const service = await Service.findOne({id:comment.idService,idUser:req.uid});
        
        let reply = '';
        if(service)
            reply = new ReplyComment({text,author:service.id});
        else
            reply = new ReplyComment({text,author:req.uid});

        await reply.save();

        await Comments.findByIdAndUpdate(id,{$push:{replyTo:reply.id}});

        res.json({success:true,reply});
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with admin'})
    }
}



const deleteComments = async(req = request, res = response) => {
    const {id} = req.params;


    try {
        const reply = await ReplyComment.findById(id);
        const comment = await Comments.findById(id);
        if(reply){
            //Verify if the author is him or his businnes.
            const service = await Service.findById(reply.author);
            if((!service) && (reply.author != req.uid)){
                return res.status(400).json({success:false, msg:'that comment is not yours'});
            }

            //delete comment
            await ReplyComment.findByIdAndUpdate(id,{status:false});

        }else if(comment){
            //Verify if the author is him or his businnes.
            if(comment.author != req.uid){
                return res.status(400).json({success:false,msg:'that comment is not yours'});
            }

            //delete comment
            const replies = await Comments.findByIdAndUpdate(id,{status:false},{new:true});
            for (reply of replies.replyTo)
                await ReplyComment.findByIdAndUpdate(reply.id,{status:false});
           

        }else{
            return res.status(400).json({success:false,msg:'id does not exists'});
        }

        res.json({success:true,msg:'comment deleted'});

    } catch (error) {
        res.status(500).json({success:false, msg:'contact with the amdmin'});
    }
}


module.exports = {
    getComments,
    putComment,
    postComments,
    deleteComments,
    postReplyTo

}