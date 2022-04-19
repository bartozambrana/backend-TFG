const bcryptjs = require("bcryptjs");
const { request, response } = require("express");


const createJWT = require("../helpers/createJWT");
const User = require("../models/users");

/* Documented */
const login = async(req = request, res = response)=>{
    const {email,password} = req.body;

    try{
        //Verify if user exists
        const user = await User.findOne({email}).populate({path:'followServices',select:'serviceName'});

 
        if(!user){
            return res.status(400).json({
                success:false,
                msg:'email incorrect'
            })
        }
        //Verify user Status.
        if(!user.status){
            return res.status(400).json({
                success:false,
                msg:'status:false'
            })
        }
        //Verify password.
        const validPassword = bcryptjs.compareSync(password, user.password);
        if(!validPassword){
            return res.status(400).json({
                success:false,
                msg:'password incorrect'
            }) 
        }
        token = await createJWT(user.id)
        res.json({
            success:true,
            user,
            token
        })
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            msg:'Talk to the administrator'
        })
    }
    
}


module.exports = {
    login
}