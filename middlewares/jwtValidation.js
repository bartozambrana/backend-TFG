const jwt = require('jsonwebtoken')

const jwtValidation = (req, res, next) =>{
    const token = req.header('token');
    if(!token){
        return res.status(401).json({
            msg:'token empty'
        });
    }

    try {
        const {uid} = jwt.verify(token,process.env.SECRET_TOKEN); //invalid => throw new Error.
        //we put the uid in the request because then it can be use in others middlewares.
        req.uid = uid;

        next();
    } catch (error) {
        return res.status(401).json({
            msg:'token invalid'
        });
    }
    
}

module.exports = jwtValidation;