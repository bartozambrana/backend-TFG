const { response } = require('express');
const extensionValidation = (req, res = response, next) => {
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

    next();
}

const validationFilePost = (req,res,next) => {
    if (!req.files || Object.keys(req.files).length != 1) {
        return res.status(400).json({ 
            msg: 'you only can upload one picture',
            success:false
        });
    }
    next();
}
module.exports = {
    extensionValidation,
    validationFilePost
}