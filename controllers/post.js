/** requirements **/
const {response,request} = require('express');


/** Local requirements **/
const Post = require('../models/posts');
const User = require('../models/users');
const Service = require('../models/services');

const { sendMultipleEmails } = require('../helpers/sendEmail');
const { extensionValidation,
        uploadCloudinary, 
        deleteFileCloudinary, 
        filePostValidation} = require('../helpers/upload');

const getPosts = async(req = request, res = response)=>{
    try {
        const {idService} = req.params;
        const posts = await Post.find({idService});
        res.json({success:true,posts});
    } catch (error) {
        res.status(500).json({success:false,msg:'Contact with the admin'})
    }
}

const putPost = async(req = request, res = response)=>{
    try {
        //Verify that the user is the director of the businnes how post the post.
        const {id} = req.params;
        const service = await Post.findById(id).populate('idService');

        if(service && (service.idService.idUser == req.uid)){

            //The only thing that cant be update is the idService.
            const {idService , ...rest} = req.body;
            
            //updatePhotoPost
            if(Object.keys(req.files).length != 0){
            //extension Validation
                try {
                    await filePostValidation(req)
                    await extensionValidation(req)
                } catch (error) {
                    return res.status(400).json({success:false,msg:error})
                }
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
    } catch (error) {
        res.status(400).json({success:false,msg:'Contact with the admin'});
    }
    
    
    
}

const deletePost = async(req = request, res = response) =>{
    try {
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
    } catch (error) {
        res.status(400).json({success:false,msg:'Contact with the admin'});
    }
    
}
const postPost = async (req = request, res = response)=>{
    try {
    
        //Verify fields.
        const {id:idService} = req.params;
        const {caption,description} = req.body;

        

        //Verify that the user is the director of the businnes.
        const correct = await Service.findOne({_id:idService,idUser:req.uid});

        if(correct){
            
            //extension Validation
            try {
                await filePostValidation(req)
                await extensionValidation(req)
            } catch (error) {
                return res.status(400).json({success:false,msg:error})
            }

            //Upload the photo.
            const urls = await uploadCloudinary(req,res);
    
            //Save post
            const post = new Post({caption,photo:urls[0],description,idService});

            await post.save();

            //Send Emails to Users than follow this service.
            const users = await User.find({
                followServices:{
                    $in :[idService]
                },
                postNotifications:true
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

        
    } catch (error) {
        res.status(400).json({success:false,msg:'Contact with the admin'});     
    }
    
    
    
}

module.exports = {
    postPost,
    putPost,
    getPosts,
    deletePost
}