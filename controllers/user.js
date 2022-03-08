/** requirements - thrid party **/
const {response,request} = require('express');
const bcryptjs = require('bcryptjs');

/** Local requirements **/
const User = require("../models/users");
const Service = require("../models/services");


const getUser = async(req = request, res = response) =>{
    const {id} = req.params;
    if(id == req.uid){ //realiza la petición el mismo que quiere borrarlo.
        const user = await User.findById(id);
        res.json({
            user,
            success: true
        });
    }else{
        res.json({
            msg:`You cannot request a different user to you`,
            success: false
        });
    }
}

const putUser = async(req = request, res = response) => {
    
    const {id} = req.params;
    
    if(id == req.uid){
    
        const {password, ...rest} = req.body;
        
        //if user want to change the password
        if(password){
            const salt = bcryptjs.genSaltSync();
            rest.password = bcryptjs.hashSync(password,salt);
        }
        
        //update user.
        await User.findByIdAndUpdate(id,rest)
    }else{
        res.json({
            success: false,
            msg: 'You cannot request a different usr to you'
        })
    }
}

const postUser = async(req = request, res = response) => {
    
    
    
    //Verify fields.
    const{password, email,userName,type} = req.body;


    //Create the user instance
    const user = new User({userName,email,password,type});

    //Encrypt password.
    const salt = bcryptjs.genSaltSync();
    user.password = bcryptjs.hashSync(password,salt)


    //Save user in DataBase.
    await user.save()    

    //If type True -> He or she have a business.
    if(type){
        const{serviceCategory,serviceInfo,serviceName,
              cityName, street, postalCode} = req.body;

        const localization = {cityName,street,postalCode}

        //Create de Service instace
        const service = new Service({serviceCategory,serviceInfo,serviceName,localization});


        //Save service en DB.
        await service.save()

        return res.json({user,service});
    }

    //Obtenemos la información del body.
    res.json({
        user
    })
}

const deleteUser = async(req = request, res = response) => {
    const {id} = req.params;
    if(id == req.uid){ //realiza la petición el mismo que quiere borrarlo.
        await User.findByIdAndUpdate(id,{status:false});
        res.json({
            msg:`user with ${id} deleted`,
            success: true
        });
    }else{
        res.json({
            msg:`user with ${id} not deleted`,
            success: false
        });
    }

}

module.exports = {
    getUser,
    putUser,
    postUser,
    deleteUser
}