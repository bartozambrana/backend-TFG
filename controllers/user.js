/** requirements - thrid party **/
const {response,request} = require('express');
const bcryptjs = require('bcryptjs');

/** Local requirements **/
const User = require("../models/users");
const Service = require("../models/services");
const deleteServiceElements = require('../helpers/deleteService');




const getUser = async(req = request, res = response) =>{

    
    try{ //realiza la petición el mismo que quiere borrarlo.
        const user = await User.findById(req.uid).populate({path:'followServices',select:'serviceName'});
        let services = undefined;
        
        if(user.type)
             services = await Service.find({idUser:req.uid});
        
        if(!services)
            return res.json({
                user,
                success: true
            });
        
        res.json({
            user,
            services,
            success: true
        });
        
    }catch(error){
        res.status(500).json({
            msg:`contact with the admin`,
            success: false
        });
    }
    
}

/* Documented */
const putUser = async(req = request, res = response) => {
    

    const {password, ...rest} = req.body;
    try {

        //if user want to change the password
        if(password){
            const salt = bcryptjs.genSaltSync();
            rest.password = bcryptjs.hashSync(password,salt);
        }
        
        //update user.
        const user = await User.findByIdAndUpdate(req.uid,rest,{new:true})
    

        res.json({
            success:true,
            user
        })
        
    } catch (error) {
        res.status(500).json({status:false,msg:'contact with the adming'});
    }
        
}

/* Documented */
const postUser = async(req = request, res = response) => {
    
    
    try {
       //Verify fields.
        const{password, email,userName,type} = req.body;


        //Create the user instance
        const user = new User({userName,email,password,type});

        //Encrypt password.
        const salt = bcryptjs.genSaltSync();
        user.password = bcryptjs.hashSync(password,salt)


        //Save user in DataBase.
        await user.save()    

        //Obtenemos la información del body.
        res.json({
            success:true,
            user
        }) 
    } catch (error) {
        res.status(500).json({status:false,msg:'contact with the adming'});
    }
    
}

/* Documented */
const deleteUser = async(req = request, res = response) => {

    try {
        //realiza la petición el mismo que quiere borrarlo.
        const user = await User.findByIdAndUpdate(req.uid,{status:false});
        
        if(user.type){
            const services = await Service.find({idUser:user.id});
            for(const service of Object.values(services))
                await deleteServiceElements(service.id);
        }

        res.json({
            msg:`user with ${req.uid} deleted`,
            success: true
        });
    } catch (error) {
        res.status(500).json({msg:'contact with admin',success:false});
    }
    


}

module.exports = {
    getUser,
    putUser,
    postUser,
    deleteUser
}