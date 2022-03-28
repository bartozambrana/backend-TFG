/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const { serviceIdValid, workIdValid} = require('../helpers/dbValidators');
const {fieldsValidation} = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');
const {getWorks,putWork,postWork,deleteWork} = require('../controllers/work')

const router = Router();

router.get('/:idService',[
    jwtValidation,
    
],getWorks);


router.post('/:id',[
    jwtValidation,
    check('description',' invalid').isString().notEmpty(),
    check('id',' invalid').isMongoId().notEmpty().custom(serviceIdValid),
    fieldsValidation
],postWork);

router.put('/:id',[
    jwtValidation,
    check('id','id tienes que ser un id de mongo').isMongoId().custom(workIdValid),
    check('description',' invalid').optional().isString().notEmpty(),
    fieldsValidation
],putWork);


router.delete('/:id',[
    jwtValidation,
    check('id','id tienes que ser un id de mongo').isMongoId().custom(workIdValid),
    fieldsValidation
],deleteWork)


module.exports = router;