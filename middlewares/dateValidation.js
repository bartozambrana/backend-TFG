const Dates = require('../models/dates');

const dateValidation = async(req, res, next) => {
    const {id} = req.params;
    const {idOldDate} = req.body;
    try {
        if(idOldDate){
            const dateExists = await Dates.findOne({id:idOldDate,idUser:req.uid});
            if(!dateExists){
                return res.status(400).json({success:false,msg:'Old Appointment do not exists or you are not the apointment owner'});
            }
        }
        //Obtain all information about date id.
        const newDate = await Dates.findById(id);
        
        //Verify that date is avaliable.
        if(!newDate.status){
            return res.status(400).json({success:false,msg:'That appointment is not avaliable'});
        }

        //Verify if user have another appointment at same time.
        const anotherDate = await Dates.find({idUser:req.uid,id: {$ne: idOldDate}, 
            $or: [
                {
                    initHour:{$lte: newDate.initHour},
                    $and:[{endHour: {$lte: newDate.endHour}},{endHour: {$gte: newDate.initHour}},{date:{$eq:newDate.date}}]
                },
                {
                    $and: [{initHour:{$gte: newDate.initHour}},{initHour:{$lte: newDate.endHour}},{date:{$eq:newDate.date}}],
                    endHour: {$gte:newDate.endHour}
                }
            ]
        })
        if(anotherDate.length != 0){
            return res.status(400).json({success:false,msg:'You have incompatible dates'}); 
        }
        
        next();
    } catch (error) {
        res.status(500).json({success:false,msg:'Date Validation - contact with the admin'});
    }
}

module.exports = dateValidation;