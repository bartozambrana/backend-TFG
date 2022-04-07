const {Schema,model} = require('mongoose');


const Dates = Schema({
    status:{
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        required: true
    },
    initHour:{        // Int 0 - 1440 === 60min * 24h/min = 1440
        type: Number,
        required: true
    },
    endHour:{        // Int 0 - 1440 === 60min * 24h/min = 1440
        type: Number,
        required: true
    },
    valoration:{
        type:Number
    },
    idService:{
        type: Schema.Types.ObjectId,
        ref:'Service',
        required:true
    },
    idUser:{
        type: Schema.Types.ObjectId,
        ref:'User'
    }
}); 

Dates.methods.toJSON = function() {
    const{ __v,_id, ...date} = this.toObject();
    date.uid = _id
    return date;
}

module.exports = model('Date',Dates);