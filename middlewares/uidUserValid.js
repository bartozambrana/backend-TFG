
const userUIDValid = (req, res, next) =>{
   

    try {
        if(req.)

        next();
    } catch (error) {
        return res.status(401).json({
            msg:'token invalid'
        });
    }
    
}

module.exports = userUIDValid;