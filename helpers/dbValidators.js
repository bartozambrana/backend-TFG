const User = require('../models/users');
const Service = require('../models/services');
const Post = require('../models/posts');
const Work = require('../models/works');
const Dates = require('../models/dates');
const Comments = require('../models/Comments');
const ReplyComment = require('../models/ReplyComment');

const validHourFormat = async(hour)=>{
    const hourRegExp = /^[0-9]{2}\:[0-9]{2}$/
    if(!hourRegExp.test(hour))
        throw new Error('The hour format is <number><number>:<number><number>');
    const hours = hour.split(":");
    if(parseInt(hours[0]) > 24)
        throw new Error('First 2 digits have to be less or equal to 24');
    if(parseInt(hours[1]>59))
        throw new Error('Last 2 digits have to be less than 60');
}
const userIdValid = async(idUser) => {

    const userExists = await User.findOne({id:idUser,status:true});
    if(!userExists){
        throw new Error(`Service with id: ${id} not exists`);
    }
}

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

const dateIdValid = async(id) => {
    const dateExists = await Dates.findById(id);
    if(!dateExists){
        throw new Error(`Date with id: ${id} not exists`);
    }
}

const isUserOrService = async(id) => {
    const user = await User.findById(id)
    const service = await Service.findById(id);
    if((!user) && (!service)){
        throw new Error('You send a id than does not exists')
    }
}

const commentIdValid = async(id) => {
    const commentExists = await Comments.findById(id);
    if(!commentExists){
        throw new Error(`Comment with id: ${id} not exixts`);
    }
}

const replyIdValid = async(id) => {
    const commentExists = await ReplyComment.findById(id);
    if(!commentExists){
        throw new Error(`Comment with id: ${id} not exixts`);
    }
}

const categoryValid = async(category) => {
    const validCategories = ['eletrónica','mecánica','auditoría-asesoría','aseguradoras',"peluquería",'dentistas']

    if(!validCategories.includes(category)){
        throw new Error(`Category not valid, avaliables categories ${validCategories}`);
    }
}
module.exports = {
    userNameValid,
    emailValid,
    serviceNameValid,
    serviceIdValid,
    postIdValid,
    workIdValid,
    dateIdValid,
    userIdValid,
    isUserOrService,
    commentIdValid,
    replyIdValid,
    categoryValid,
    validHourFormat
}