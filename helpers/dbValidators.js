const User = require('../models/users');


//Email.
const emailValid = async(email) =>{    
    const emailExists = await User.findOne({email});
    if(emailExists){
        throw new Error(`email ${email} already exists`)
    }
}

//UserName.
const userNameValid = async(userName) =>{    
    const userExists = await User.findOne({userName});
    if(userExists){
        throw new Error(`User name ${userName} already exists`)
    }
}

module.exports = {
    userNameValid,
    emailValid,
}