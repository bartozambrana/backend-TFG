/** requirements **/
const {response,request} = require('express');


/** Local requirements **/
const Post = require('../models/posts');
const User = require('../models/users');
const Service = require('../models/services');
const { sendMultipleEmails } = require('../helpers/sendEmail');
const { loadFiles } = require('../helpers/loadFile');

const postPost = async(req = request, res = response)=>{
    //Verify fields.
    const {caption,photo,description,idService} = req.body;

    //Verify that the user is the director of the businnes.
    const correct = await Service.findOne({_id:idService,idUser:req.uid});

    if(correct){
         
        //Save post
        const post = new Post({caption,photo,description,idService});

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
            toEmail
        });
    }

    res.status(400).json({
        success: false,
        msg:'the user is not the bussiness owner'
    })

   
}
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

        //we only update the fields of the body request 
        await Post.findByIdAndUpdate(id,rest);
       
        return res.json({
            success:true
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
    const service = await Post.findById(id).populate('idService');

    if(service && (service.idService.idUser == req.uid)){


        //we only update the fields of the body request 
        await Post.findByIdAndDelete(id);
       
        return res.json({
            success:true
        });
    }

    res.json({
        success:false,
        msg:"The user is not the bussiness director or id Invalid"
    });
}
const pruebaPostImages = async(req = request, res = response)=>{
    //Verify that the user is the director of the businnes how post the post.
    console.log(req.files)
    console.log(req.body)

    loadFiles(req,res)
    
    
}

module.exports = {
    postPost,
    putPost,
    getPosts,
    deletePost,
    pruebaPostImages
}