/* Global requiremnts */
const {request, response} = require('express');

/* Local requirements */
const Service = require('../models/services');
const Dates = require('../models/dates');
const User = require('../models/users');

const { sendIndividualEmail, sendDatesBussinessMan } = require('../helpers/sendEmail');
const { createPdfDocument, cleanPDF } = require('../helpers/upload');
const path = require('path')
const fs = require('fs')

/***************************************
 ***************************************
 ***************************************/

//All dates of a user.
const hourToInteger = (hour) => {
    const elements = hour.split(":");
    return( (parseInt(elements[0])*60) + parseInt(elements[1]));
}


/* Documented */
const getAllDatesUser = async(req = request, res = response) =>{
    try{
        const userDates = await Dates.find({idUser:req.uid}).sort({date:-1});
        res.json({
            success:true,
            userDates,
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            msg:'contact with the admin'
        });
    }
}

const getDatesAvaliablesService = async (req = request, res = response) =>{
    const {dateInput} = req.body;
    const {idService} = req.params;

    
    try {
        const dateQuery = new Date(dateInput);
        const dates = await Dates.find({idService,date:dateQuery,status:true});
        res.json({success:true,dates});
    } catch (error) {
        res.status(500).json({success:false, msg:'contact with the admin'});        
    }
}

const getAsignedDates = async(req=request, res = response) => {
    const {dateInput} = req.body;
    const {idService} = req.params;

    //Verify that the user is the service owner.
    try {
        const service = await Service.findById(idService);
        if(service.idUser != req.uid){
            return res.status(400).json({success:false,msg:'the user is not the owner service'});
        }
        const dateQuery = new Date(dateInput);
        const dateList = await Dates.find({idService,date:dateQuery,status:false});
        res.json({success:true,dates:dateList});
    } catch (error) {
        res.status(500).json({success:false,msg:'Contact with the admin'});
    }
}

/* Documented */
const postDate = async(req = request, res = response) =>{
    
    try {
        const {dateDay,status,idService} = req.body;
        let {initHour,endHour} = req.body;
    
        //Create correct hour format to save it.
        initHour = hourToInteger(initHour);
        endHour = hourToInteger(endHour);


        if(initHour >= endHour){
            return res.status(400).json({
                msg:'hours definied are invalid',
                success: false
            });
        }
        //Verify that the user is the owner of the bussiness
        const service = await Service.findOne({id:idService, idUser: req.uid});
        if(!service){
            return res.status(400).json({
                msg:'That service does not exist for that user',
                success:false
            });
        }
        //Create and save the new date
        let newDate = '';
        if(status){
            newDate = new Dates({date: new Date(dateDay),initHour,endHour,idService,status});
        }else{
            newDate = new Dates({date: new Date(dateDay),initHour,endHour,idService});
        }
        
        await newDate.save();

        res.json({success:true, date:newDate});

    } catch (error) {
        console.log(error);
        res.status(500).json({success:false, msg:'contact with the admin'});
    }
}

const putDate = async(req = request, res = response) =>{
    
    try {
        const {id} = req.params;
        const service = await Dates.findById(id).populate('idService');
        if(service.idService.idUser != req.uid){
            return res.status(400).json({success:false,msg:'the user is not the owner service'});
        }
        
        
        const {idService} = req.body;
        let {initHour,endHour, ...rest} = req.body;

        if(initHour){
            initHour = hourToInteger(initHour);
            rest.initHour = initHour;
        }
        

        if(endHour){
            endHour = hourToInteger(endHour);
            rest.endHour = endHour;

        }

        if(rest.date){
            rest.date = new Date(res.date);
        }
        

        const dateUpdated = await Dates.findByIdAndUpdate(id,rest,{new:true})
        res.json({success:true,date:dateUpdated});
    } catch (error) {

        res.status(500).json({success:false,msg:'contact with the admin'});
    }
}

const putSelectDateUser = async(req = request, res=response) => {
    const {id} = req.params;
    try {
        //Select date.
        const dateUpdated = await Dates.findByIdAndUpdate(id,{status:false,idUser:req.uid},{new:true});
        //Async email send.
        sendIndividualEmail({
            subject:'Cita Seleccionada',
            toEmail: dateUpdated.idUser.email,
            text: `Se ha establecido su cita para el día, ${dateUpdated.date.getDate()}-${dateUpdated.date.getMonth()+1}-${dateUpdated.date.getFullYear()}`,
            header:'Notificación de selección de cita'
        });
        res.json({success:true,date:dateUpdated});
        
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with the admin'});
    }
}

/* Documented */
const putModifyDate = async(req = request, res = response) =>{
    const {id} = req.params; 
    const {idOldDate} = req.body;

    try {
        //liberamos la cita anterior, puede realizarse asíncrono.
        await Dates.findByIdAndUpdate(idOldDate,{status:true,$unset:{idUser:""}});
        //Establecemos nueva cita.
        const dateUpdated =  await Dates.findByIdAndUpdate(id,{status:false, idUser: req.uid},{new:true});
        //Async email send.
        sendIndividualEmail({
            subject:'Cita Modificada',
            toEmail: dateUpdated.idUser.email,
            text: `Se ha actualizado su cita para el día, ${dateUpdated.date.getDate()}-${dateUpdated.date.getMonth()+1}-${dateUpdated.date.getFullYear()}`,
            header:'Notificación de modificación de cita'
        });

        res.json({success:true,date:dateUpdated});
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with the admin'});
    }

} 
/* Documented */
const putCancelDate = async(req = request, res = response) => {
    const {id} = req.params;
    
    try {
        const date = await Dates.findById(id).populate('idService');
        if((date.idUser == req.uid) || (date.idService.idUser == req.uid)){
            const dateUpdated = await Dates.findByIdAndUpdate(id,{status:true,$unset:{idUser:""}});
            const user = await User.findById(dateUpdated.idUser);
            //Async email send.
            sendIndividualEmail({
                subject:'Cita Cancelada',
                toEmail: user.email,
                text: `Se ha cancelado su cita para el día, ${dateUpdated.date.getDate()}-${dateUpdated.date.getMonth()+1}-${dateUpdated.date.getFullYear()}`,
                header:'Notificación de cancelación de cita'
            });
            return res.json({success:true, msg:'Date cancelled.'})
        }
        return res.status(500).json({success:false, msg:'you are not the owner of that appointment'});
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,msg:'contact with the admin'});
    }
}


/* Documented */
const deleteDate = async(req = request, res = response) =>{
    const {id} = req.params;
    try {
        const date = await Dates.findById(id).populate('idService');
        if(date.idService.idUser == req.uid){
            await Dates.findByIdAndDelete(id);
            return res.json({success:true, msg:'Date deleted.'})
        }
        res.status(500).json({success:false, msg:'you are not bussiness man'});
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with the admin'});
    }
}

const getDatesPDF = async(req = request, res = response) => {
    //Verify user is the bussiness owner.
    const {id} = req.params;

    const service = await Service.findById(id).populate('idUser');

    if(service.idUser.id != req.uid )
        return res.status(400).json({success:false,msg:'You are not the user owner of this businnes'});
    
    const initDate = new Date(req.body.initDate);
    const endDate = new Date(req.body.endDate);

    const dateList = await Dates.find({
        date:{$gte: initDate},
        date:{$lte:endDate},
        status:false
    }).populate({path:'idUser',select:'userName email -_id'});
;

    const nameFile = await createPdfDocument(dateList);
    const filePath = path.join(__dirname,'../pdfs',nameFile);
    const toEmail = service.idUser.email;

    await sendDatesBussinessMan({toEmail,nameFile});
    cleanPDF(nameFile);
    res.json({
        success:true,
        msg:'Dates send by email'
    })

}

const postValorationDate= async ( req=request, res=response) =>{
    
    const {id} = req.params;
    const {valoration} = req.body;
    //Verify user
    const date = await Dates.findById(id);
    if(date.idUser != req.uid)
        return res.status(400).json({
            success:false,
            msg:'you dont had that appointment'
        });
    
    if(date.valoration)
        return res.status(400).json({
            success:false,
            msg:'you have a valoration for that date yet'
        });
    
    await Dates.findByIdAndUpdate(id,{valoration},{new:true});
    res.json({success:true,msg:'Valoration added'});
}

module.exports = {
    getAllDatesUser,
    getDatesAvaliablesService,
    postDate,
    putModifyDate,
    putSelectDateUser,
    putCancelDate,
    putDate,
    deleteDate,
    getAsignedDates,
    getDatesPDF,
    postValorationDate
}