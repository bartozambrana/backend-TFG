const {Schema,model} = require('mongoose');


const User = Schema({
    userName:{
        type:String,
        required: [true,'The userName is obligatory'],
        unique: true
    },
    email:{
        type: String,
        required: [true,'The email is obligatory'],
        unique: true
    },
    password:{
        type: String,
        required: [true,'The email is obligatory']
    },
    type:{
        type:Boolean,
        required: [true,'The type is obligatory']
    },
    followServices: [{
        type:Schema.Types.ObjectId,
        ref:'Services'
    }],
    status:{
        type:Boolean,
        default: true
    },
    postNotifications:{
        type:Boolean,
        default: true
    }
});

User.methods.toJSON = function() {
    const{ __v,password,_id,status,postNotifications, ...user} = this.toObject();
    user.uid = _id;
    return user
}

module.exports = model('User',User);