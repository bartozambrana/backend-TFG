const User = require('../models/users');
const Service = require('../models/services');

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

//ServiceName.
const serviceNameValid = async(serviceName) => {
    const serviceExists = await Service.findOne({serviceName});
    if(serviceExists){
        throw new Error(`Service name ${serviceName} already exists`);
    }
}

//Service id.
const serviceIdValid = async(id) => {
    const serviceExists = await Service.findById(id);
    if(!serviceExists){
        throw new Error(`Service with id: ${id} not exists`);
    }
}


module.exports = {
    userNameValid,
    emailValid,
    serviceNameValid,
    serviceIdValid
}