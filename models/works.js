const {Schema,model} = require('mongoose');


const Work = Schema({
    
    photos:[{ //base64
        type: String,
        required : true
    }],
    description:{
        type:String,
        required:true
    },
    idService:{
        type: Schema.Types.ObjectId,
        ref:'Service',
        required:true
    }
}); 

Work.methods.toJSON = function() {
    const{ __v,_id, ...work} = this.toObject();
    work.uid = _id
    return work;
}

module.exports = model('Work',Work);