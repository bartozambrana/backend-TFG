/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const { login } = require('../controllers/auth');
const { fieldsValidation } = require('../middlewares/fieldsValidation');

const router = Router();


router.post('/login',[
    check('email','Email is obligatory').isEmail().notEmpty(),
    check('password','Password is obligatory').notEmpty(),
    fieldsValidation
],login)

module.exports = router;