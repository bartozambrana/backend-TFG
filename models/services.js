const {Schema,model} = require('mongoose');


const Service = Schema({
   serviceCategory:{
       type: String,
       required: true
   },
   serviceInfo:{
       type: String,
       required: true
   },
   serviceName:{
       type: String,
       required: true,
       unique: true
   },
   localization:{

       cityName: {
           type:String,
           required: true
       },

       street: {
            type:String,
            required: true
       },

       postalCode:{
           type: Number,
           required: true
       }
       
   },
   idUser:{
       type: Schema.Types.ObjectId,
       required: true,
       ref: 'User'
   },
   status:{
       type:Boolean,
       default:true
   } 
}); 

Service.methods.toJSON = function() {
    const{ __v,_id,status, ...service} = this.toObject();
    service.uid = _id
    return service;
}

module.exports = model('Service',Service);
