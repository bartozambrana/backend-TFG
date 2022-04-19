/* Global requiremnts */
const {request, response} = require('express');

/* Local requirements */
const Work = require('../models/works');
const Service = require('../models/services');
const User = require('../models/users');
const { sendMultipleEmails } = require('../helpers/sendEmail');
const {uploadCloudinary,deleteFileCloudinary,extensionValidation} = require('../helpers/upload');


const getWorks = async(req = request,res = response) => {
    try {
        const {idService} = req.params;
        const works = await Work.find({idService})
        res.json({
            success:true,
            works
        })
    } catch (error) {
        res.status(400).json({success:false,msg:'Contact with the admin'});
    }
    
    
}

const postWork = async(req = request,res = response) => {
    try {
        //Verify fields.
        const {id:idService} = req.params;
        const {description} = req.body;

        //Verify that the user is the director of the businnes.
        const correct = await Service.findOne({_id:idService,idUser:req.uid});

        if(correct){
            try {
                await extensionValidation(req)
            } catch (error) {
                return res.status(400).json({success:false,msg:error})
            }
            //Upload the photo.
            const urls = await uploadCloudinary(req,res);
            
            //Save post
            const work = new Work({photos:urls,description,idService});

            await work.save();

            //Send Emails to Users than follow this service.
            const users = await User.find({
                followServices:{
                    $in :[idService]
                }
            }).select('email -_id');

            const toEmail = users.map((user)=>{return user.email});

            if(toEmail.length != 0){
                sendMultipleEmails({
                    subject: `Nuevo trabajo del servicio ${correct.serviceName}`,
                    toEmail: toEmail,
                    text: `El servicio ${correct.serviceName} ha establecido un post que te puede interesar`,
                    header: 'Nuevo Trabajo'
                })
            }
            
            return res.json({
                success: true,
                msg:'Work upload'
            });
        }

        res.status(400).json({
            success: false,
            msg:'the user is not the bussiness owner'
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({success:false,msg:'Contact with the admin'});
    }
    

}

/* Documented */

const putWork = async(req = request,res = response) => {
    try {
        const {id} = req.params;
        const work = await Work.findById(id).populate('idService');

        if(work && (work.idService.idUser == req.uid)){
            const {deletedFiles} = req.body;
            let workUpdated = '';

            if(deletedFiles){
                const documents = deletedFiles.split(';');

                workUpdated = await Work.findByIdAndUpdate(id,{
                    $pull: {"photos" : {$in:documents}}
                },{new:true});

                for(photo of documents){
                    deleteFileCloudinary(photo);
                }
            }

            //If we receipt one or more new file.
            if(req.files && (Object.keys(req.files).length != 0)){
                try {
                    await extensionValidation(req)
                } catch (error) {
                    return res.status(400).json({success:false,msg:error})
                }
                const urls = await uploadCloudinary(req,res)
                // update the object.
                workUpdated = await Work.findByIdAndUpdate(id,{
                    $push:{"photos":{$each : urls}}
                },{new: true});
            }
            
            const{description} = req.body;
            if(description){
                workUpdated = await Work.findByIdAndUpdate(id,{description},{new:true});
            }

            return res.json({
                success : true,
                work: workUpdated
            });
        }

        res.status(400).json({
            success:false,
            msg:'The user is not the owner'
        })
    } catch (error) {
        res.status(400).json({success:false,msg:'Contact with the admin'});
    }
    
    
}

/* Documented */
const deleteWork = async (req = request,res = response) => {
    try {
        //Verify that the user is the director of the businnes how post the work.
        const {id} = req.params;
        const work = await Work.findById(id).populate('idService');

        if(work && (work.idService.idUser == req.uid)){
            for(photo of work.photos){
                deleteFileCloudinary(photo);
            }
            
            //we only update the fields of the body request 
            await Work.findByIdAndDelete(id);
        
            return res.json({
                success:true,
                msg:'work deleted'
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

module.exports = {
    getWorks,
    putWork,
    postWork,
    deleteWork
}