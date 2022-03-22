const {response,request} = require('express');
const path = require('path');

const loadFiles = (req = request, res = response) =>{
    if( !req.files || Object.keys(req.files).length === 0){
        return res.status(400).json({msg:'No image to upload'})
    }

    
    Object.entries(req.files).map((entry) => {
        file = entry[1];
       
        const uploadPath = path.join(__dirname,'../uploads',file.name);
        file.mv(uploadPath, (err) =>{
            if(err){
                return res.status(500).json({err});
            }
        })
    })

    res.json({msg:'files Upload'});

}


module.exports = {
    loadFiles
}