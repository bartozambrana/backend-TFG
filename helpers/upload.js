const path = require('path');
const fs = require('fs');

const { response, request } = require('express');
const { v4: uuidv4 } = require('uuid');
const Post = require('../models/posts');

const cloudinary = require('cloudinary').v2
cloudinary.config(process.env.CLOUDINARY_URL)

const extensionValidation = (req, res = response) => {
    if (!req.files || Object.keys(req.files).length ===0) {
        return res.status(400).json({ msg: 'No image to upload',success:false });

    }

    let extension = '';
    const validExtensions = ['png','jpg', 'jpeg', 'gif'];
    let error = false;
    Object.entries(req.files).map((entry) => {
        file = entry[1];
        extension = file.name.split('.').pop();
        if (!validExtensions.includes(extension)) {
            error = true;
        }
    })

    if (error) {
        return res.status(400).json({
            msg: `extensions files ${extension} is invalid, valid extensions: ${validExtensions}`,
            success:false
        });
    }

}

const validationFilePost = (req,res) => {
    if (!req.files || Object.keys(req.files).length != 1) {
        return res.status(400).json({ 
            msg: 'you only can upload one picture',
            success:false
        });
    }
}

const loadFiles = (req = request, res = response) => {
    let error = '';
    let names = [];
    Object.entries(req.files).map((entry) => {
        file = entry[1];
        //newID + '.' + extension
        const name = uuidv4() + '.' + file.name.split('.').pop();
        names.push(name);
        const uploadPath = path.join(__dirname, '../uploads', name);
        file.mv(uploadPath, (err) => {
            if (err) {
                error = err;
            }
        })
    })

    if (error != '')
        return res.status(500).json({ msg: error, success: false });

    return names;

}

const cleanFiles = (names) => {
    names.map((nameFile) => {
        const pathFile = path.join(__dirname, '../uploads', nameFile);
        if (fs.existsSync(pathFile)) {
            fs.unlinkSync(pathFile)
        }

    });
}

const uploadCloudinary =  async(req, res) => {
    extensionValidation(req,res); //Verify extensions
    let urls = [];
    for(const file of Object.values(req.files)){
        const {secure_url} = await cloudinary.uploader.upload(file.tempFilePath);
        urls.push(secure_url);
    }

    
    return urls;
}

const deleteFileCloudinary = (name) =>{
    const [public_id] = name.split('/').pop().split('.');
    cloudinary.uploader.destroy(public_id);
}



module.exports = {
    loadFiles,
    cleanFiles,
    uploadCloudinary,
    validationFilePost,
    deleteFileCloudinary
}