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
        required: [true,'The email is obligatory']
    },
    followServices: [{
        type:Schema.Types.ObjectId,
        ref:'Services'
    }],
    status:{
        type:Boolean,
        default: false
    },
    postNotifications:{
        type:Boolean,
        default: false
    }
});

User.methods.toJSON = function() {
    const{ __v,password,_id, ...user} = this.toObject();
    user.uid = _id;
    return user
}

module.exports = model('User',User);