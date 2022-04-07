/* Global requiremnts */
const {request, response} = require('express');

/* Local requirements */
const Service = require('../models/services');
const Dates = require('../models/dates');
const User = require('../models/users');
const { findById, findByIdAndUpdate, updateMany } = require('../models/services');
const { sendIndividualEmail } = require('../helpers/sendEmail');


/***************************************
 ***************************************
 ***************************************/

//All dates of a user.
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

const postDate = async(req = request, res = response) =>{
    const {dateDay, initHour, endHour,status,idService} = req.body;
    try {
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
        res.status(500).json({success:false, msg:'contact with the admin'});
    }
}

const putDate = async(req = request, res = response) =>{
    const {id} = req.params;
    const {idService,idUser, ...rest} = req.body;
    try {
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
        const dateUpdated = await Dates.findByIdAndUpdate(id,{status:false,idUser:req.uid},{new:true}).populate('idUser');
        //Async email send.
        sendIndividualEmail({
            subject:'Cita Seleccionada',
            toEmail: dateUpdated.idUser.email,
            text: `Se ha establecido su cita para el día, ${dateUpdated.date.getDate()}-${dateUpdated.date.getMonth()}-${dateUpdated.date.getFullYear()}`,
            header:'Notificación de selección de cita'
        });
        res.json({success:true,date:dateUpdated});
        
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with the admin'});
    }
}

const putModifyDate = async(req = request, res = response) =>{
    const {id} = req.params; 
    const {idOldDate} = req.body;

    try {
        //liberamos la cita anterior, puede realizarse asíncrono.
        await Dates.findByIdAndUpdate(idOldDate,{status:true,$unset:{idUser:""}});
        //Establecemos nueva cita.
        const dateUpdated =  await Dates.findByIdAndUpdate(id,{status:false, idUser: req.uid},{new:true}).populate('idUser');
        //Async email send.
        sendIndividualEmail({
            subject:'Cita Modificada',
            toEmail: dateUpdated.idUser.email,
            text: `Se ha actualizado su cita para el día, ${dateUpdated.date.getDate()}-${dateUpdated.date.getMonth()}-${dateUpdated.date.getFullYear()}`,
            header:'Notificación de modificación de cita'
        });

        res.json({success:true,date:dateUpdated});
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with the admin'});
    }

} 

const putCancelDate = async(req = request, res = response) => {
    const {id} = req.params;
    
    try {

        const dateUpdated = await Dates.findOneAndUpdate({id,idUser:req.uid},{status:true,$unset:{idUser:""}});
        const user = await User.findById(req.uid);
        //Async email send.
        sendIndividualEmail({
            subject:'Cita Cancelada',
            toEmail: user.email,
            text: `Se ha cancelado su cita para el día, ${dateUpdated.date.getDate()}-${dateUpdated.date.getMonth()}-${dateUpdated.date.getFullYear()}`,
            header:'Notificación de cancelación de cita'
        });
        res.json({success:true, msg:'Date cancelled.'})
        
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with the admin'});
    }
}



const deleteDate = async(req = request, res = response) =>{
    const {id} = req.params;
    try {
        await Dates.findByIdAndDelete(id);
        res.json({success:true, msg:'Date deleted.'})
    } catch (error) {
        res.status(500).json({success:false,msg:'contact with the admin'});
    }
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
}