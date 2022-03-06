const bcryptjs = require("bcryptjs");
const { request, response } = require("express");


const createJWT = require("../helpers/createJWT");
const User = require("../models/users");
const login = async(req = request, res = response)=>{
    const {email,password} = req.body;

    try{
        //Verify if user exists
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                msg:'email incorrect'
            })
        }
        //Verify user Status.
        if(!user.status){
            return res.status(400).json({
                msg:'status:false'
            })
        }
        //Verify password.
        const validPassword = bcryptjs.compareSync(password, user.password);
        if(!validPassword){
            return res.status(400).json({
                msg:'password incorrect'
            }) 
        }
        token = await createJWT(user.id)
        res.json({
            user,
            token
        })
    }catch(error){
        res.status(500).json({
            msg:'Talk to the administrator'
        })
    }
    
}


module.exports = {
    login
}