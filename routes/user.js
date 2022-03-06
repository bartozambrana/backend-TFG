/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const {getUser,putUser,postUser,deleteUser} = require('../controllers/user');
const { emailValid, userNameValid } = require('../helpers/dbValidators');
const { fieldsValidation } = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');

const router = Router();

router.get('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId()
], getUser);      //Obtain the user information.
router.put('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId()
], putUser);      //Update user :id.
router.post('/',[
    check('email','email not valid').isEmail().notEmpty(),
    check('userName','user name invalid').isString().notEmpty(),
    check('password','password invalid').isString().notEmpty(),
    check('type','type invalid').isBoolean().notEmpty(),
    check('email').custom(emailValid),
    check('userName').custom(userNameValid),
    fieldsValidation
],postUser);        //New user.

router.delete('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId()
],deleteUser); //Delete user :id.

module.exports = router;