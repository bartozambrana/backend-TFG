const path = require('path');
const fs = require('fs');



const { response, request } = require('express');
const { v4: uuidv4 } = require('uuid');

const PdfPrinter = require('pdfmake');


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

const cleanPDF = (nameFile) => {
    
    const pathFile = path.join(__dirname, '../pdfs', nameFile);
    if (fs.existsSync(pathFile)) {
        fs.unlinkSync(pathFile)
    }


}

const createPdfDocument = async(dates) => {

    const fonts = {
        Roboto: {
          normal: path.resolve(__dirname,'../fonts/WorkSans-Light.ttf'),
          bold: path.resolve(__dirname,'../fonts/WorkSans-Light.ttf'),
          italics: path.resolve(__dirname,'../fonts/WorkSans-Light.ttf'),
          bolditalics: path.resolve(__dirname,'../fonts/WorkSans-Light.ttf')
        }
      };

    //Create pdf maker with load's fonts
    const pdfmake = new PdfPrinter(fonts);
    //Create styles:
    const stylesDocument = {
        header:{
            fontSize:20,
            bold:true,
            alignment:'center',
            margin:[10,30,10,20],
            text:'Citas'
        },
        footer:{
            fontSize:10,
            alignment:'right',
            margin:[10,30,10,20],
            text:'© TFG-Bartolomé Zambrana.'

        },
        text:{
            alignment:'justify'
        }
    }
    //Create the content.
    const line = {
        table:{
            headerRows:1,
            widths:[400],
            body:[
                [''],['']
            ]
        },
        layout : 'headerLineOnly'
    }
    let contentDocument = [{
        text:'\nLas citas escogidas por los usuarios son las siguientes:\n',
        style:'text'
    }];
    
    for(appointment of Object.values(dates)){
        const initHour = Math.floor(appointment.initHour/60);
        const endHour = Math.floor(appointment.endHour/60);
        const minutesInit = appointment.initHour - Math.floor(appointment.initHour/60);
        const minutesEnd = appointment.endHour - Math.floor(appointment.endHour/60);

        contentDocument.push(line);
        contentDocument.push({
            text:`${appointment.date.getDate()}-${appointment.date.getMonth()+1}-${appointment.date.getFullYear()}    `+
            `   ${initHour}:${minutesInit}h - ${endHour}:${minutesEnd}h`+
            `   ${appointment.idUser.userName} - ${appointment.idUser.email}`,style:'text'
        })

    }

    const document = {
        content:contentDocument,
        styles:stylesDocument
    }

    const nameFile = dates[0].idService +'.pdf';
    let pdfDocument = pdfmake.createPdfKitDocument(document,{});
    const stream = fs.createWriteStream(path.join(__dirname,'../pdfs',nameFile));
    pdfDocument.pipe(stream);

    pdfDocument.end();

    await new Promise(resolve=>{
        stream.on('finish',() => {resolve()});
    });


    return nameFile;

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
    deleteFileCloudinary,
    createPdfDocument,
    cleanPDF
}