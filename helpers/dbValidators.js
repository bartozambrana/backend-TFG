const User = require('../models/users');
const Service = require('../models/services');
const Post = require('../models/posts');
const Work = require('../models/works');

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

const postIdValid = async(id) =>{
    const postExists = await Post.findById(id);
    if(!postExists){
        throw new Error(`Post with id: ${id} not exists`);
    }
}

const workIdValid = async(id) => {
    const workExists = await Work.findById(id);
    if(!workExists){
        throw new Error(`Work with id: ${id} not exixts`);
    }
}


module.exports = {
    userNameValid,
    emailValid,
    serviceNameValid,
    serviceIdValid,
    postIdValid,
    workIdValid
}