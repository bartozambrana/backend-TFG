/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const {getService,putService,postService,deleteService,postFollowService, obtainServiceByCategory, obtainCategoriesAvaliables, obtainAllServices} = require('../controllers/service');
const { serviceNameValid, serviceIdValid, categoryValid } = require('../helpers/dbValidators');
const { fieldsValidation } = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');


const router = Router();

router.get('/all/',[jwtValidation],obtainAllServices)

router.get('/byCategory/',[
    jwtValidation,
    check('category','invalid').isString().notEmpty().custom(categoryValid),
    fieldsValidation
],obtainServiceByCategory)

router.get('/categories/',[
    jwtValidation
],obtainCategoriesAvaliables)

router.get('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId().custom(serviceIdValid),
    fieldsValidation
],getService);




router.post('/',[
    jwtValidation,
    check('serviceName','Invalid').isString().notEmpty().custom(serviceNameValid),
    check('serviceInfo','Invalid').isString().notEmpty(),
    check('cityName','Invalid').isString().notEmpty(),
    check('street','Invalid').isString().notEmpty(),
    check('postalCode','Invalid').isNumeric().notEmpty(),
    check('serviceCategory','Invalid').isString().notEmpty().custom(categoryValid),
    fieldsValidation
],postService)



router.post('/follow-unfollow/:id',[
    jwtValidation,
    check('id','It is not a valid Id').isMongoId().notEmpty().custom(serviceIdValid),
    fieldsValidation
],postFollowService)

router.put('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId().custom(serviceIdValid),
    check('serviceCategory','Invalid').optional().isString().notEmpty().custom(categoryValid),
    check('serviceName','Invalid').optional().isString().notEmpty().custom(serviceNameValid),
    check('serviceInfo','Invalid').optional().isString().notEmpty(),
    check('cityName','Invalid').optional().isString().notEmpty(),
    check('street','Invalid').optional().isString().notEmpty(),
    check('postalCode','Invalid').optional().isNumeric().notEmpty(),
    fieldsValidation
],putService);

router.delete('/:id',[
    jwtValidation,
    check('id','No es un ID válido').isMongoId().custom(serviceIdValid),
    fieldsValidation
],deleteService);


module.exports = router