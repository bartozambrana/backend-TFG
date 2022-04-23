/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const {getUser,putUser,postUser,deleteUser} = require('../controllers/user');
const { emailValid, userNameValid, userIdValid } = require('../helpers/dbValidators');
const { fieldsValidation } = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');

const router = Router();

router.get('/',[
    jwtValidation
], getUser);      //Obtain the user information.
router.put('/',[
    jwtValidation,
    check('email','invalid').optional().isEmail().notEmpty(),
    check('type','invalid').optional().isBoolean(),
    check('password','invalid').optional().isString().notEmpty(),
    fieldsValidation
], putUser);      //Update user :id.

// New user
router.post('/',[
    check('email','email not valid').isEmail().notEmpty().custom(emailValid),
    check('userName','user name invalid').isString().notEmpty().custom(userNameValid),
    check('password','password invalid').isString().notEmpty(),
    check('type','type invalid').isBoolean().notEmpty(),
    fieldsValidation
],postUser);        //New user.

router.delete('/',[
    jwtValidation
],deleteUser); //Delete user :id.

module.exports = router;