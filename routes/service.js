/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const {getService,putService,postService,deleteService,postFollowService} = require('../controllers/service');
const { serviceNameValid, serviceIdValid } = require('../helpers/dbValidators');
const { fieldsValidation } = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');


const router = Router();

router.get('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId().custom(serviceIdValid),
    fieldsValidation
],getService);

router.post('/',[
    jwtValidation,
    check('serviceCategory','Invalid').isString().notEmpty(),
    check('serviceName','Invalid').isString().notEmpty().custom(serviceNameValid),
    check('serviceInfo','Invalid').isString().notEmpty(),
    check('cityName','Invalid').isString().notEmpty(),
    check('street','Invalid').isString().notEmpty(),
    check('postalCode','Invalid').isNumeric().notEmpty(),
    check('idUser','invalid').isMongoId().notEmpty(),
    fieldsValidation
],postService);

router.post('/follow/:id',[
    jwtValidation,
    check('id','It is not a valid Id').isMongoId().notEmpty().custom(serviceIdValid),
    fieldsValidation
],postFollowService)

router.put('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId().custom(serviceIdValid),
    fieldsValidation
],putService);

router.delete('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId().custom(serviceIdValid),
    fieldsValidation
],deleteService);


module.exports = router