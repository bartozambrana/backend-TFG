/** requirements **/
const {response,request} = require('express');


/** Local requirements **/
const Post = require('../models/posts');
const User = require('../models/users');
const Service = require('../models/services');

const { sendMultipleEmails } = require('../helpers/sendEmail');
const { validationFilePost, 
        uploadCloudinary, 
        deleteFileCloudinary } = require('../helpers/upload');

const getPosts = async(req = request, res = response)=>{
    //Verify fields - para luego más tarde al definir el frontend.
    
    //Definiendo el tmaño máximo de las fotos y tal para ser enviadas.
}

const putPost = async(req = request, res = response)=>{
    //Verify that the user is the director of the businnes how post the post.
    const {id} = req.params;
    const service = await Post.findById(id).populate('idService');

    if(service && (service.idService.idUser == req.uid)){

        //The only thing that cant be update is the idService.
        const {idService , ...rest} = req.body;
        
        //updatePhotoPost
        if(Object.keys(req.files).length != 0){
            validationFilePost(req,res);
            //clean past photo.
            const post = await Post.findById(id);
            //we delete from cloudinary
            deleteFileCloudinary(post.photo);


            //upload the new photo.
            const urls = await uploadCloudinary(req,res);
            rest.photo = urls[0];
        }
        
        
        //we only update the fields of the body request 
        await Post.findByIdAndUpdate(id,rest);
       
        return res.json({
            success:true,
            msg:'post updated'
        });
    }

    res.json({
        success:false,
        msg:"The user is not the bussiness director"
    });
    
    
}

const deletePost = async(req = request, res = response) =>{
    //Verify that the user is the director of the businnes how post the post.
    const {id} = req.params;
    const post = await Post.findById(id).populate('idService');

    if(post && (post.idService.idUser == req.uid)){

        deleteFileCloudinary(post.photo)
        //we only update the fields of the body request 
        await Post.findByIdAndDelete(id);
       
        return res.json({
            success:true,
            msg:'post deleted'
        });
    }

    res.json({
        success:false,
        msg:"The user is not the bussiness director or id Invalid"
    });
}
const postPost = async (req = request, res = response)=>{
    
    //Verify fields.
    const {id:idService} = req.params;
    const {caption,description} = req.body;

    

    //Verify that the user is the director of the businnes.
    const correct = await Service.findOne({_id:idService,idUser:req.uid});

    if(correct){
        //Upload the photo.
        const urls = await uploadCloudinary(req,res);
        
        //Save post
        const post = new Post({caption,photo:urls[0],description,idService});

        await post.save();

        //Send Emails to Users than follow this service.
        const users = await User.find({
            followServices:{
                $in :[idService]
            }
        }).select('email -_id');

        const toEmail = users.map((user)=>{return user.email});

        sendMultipleEmails({
            subject: `Nuevo post del servicio ${correct.serviceName}`,
            toEmail: toEmail,
            text: `El servicio ${correct.serviceName} ha establecido un post que te puede interesar`,
            header: 'Nuevo POST'
        })
        return res.json({
            success: true,
            msg:'Post upload'
        });
    }

    res.status(400).json({
        success: false,
        msg:'the user is not the bussiness owner'
    })

    
    
    
}

module.exports = {
    postPost,
    putPost,
    getPosts,
    deletePost
}