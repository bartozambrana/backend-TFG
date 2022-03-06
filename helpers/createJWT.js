const jwt = require('jsonwebtoken');

//Se trabajará con promesas por una mayor seguridad
const createJWT = (uid) => {
    return new Promise((resolve,reject) => {
        const payload = {uid} //In the payload we can save more things, but this can be taken, 
                              //therefore we only save the uid
        
        const token = jwt.sign(payload,process.env.SECRET_TOKEN,{
            expiresIn: '4h'
        },(error,token) =>{
            if(error){
                console.log(error);
                reject('The token cannot be created');
            }else{
                resolve(token)
            }
        });

    });
}

module.exports = createJWT;