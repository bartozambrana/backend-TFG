/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const {getPosts,postPost,putPost,deletePost,pruebaPostImages} = require('../controllers/post');
const { serviceIdValid } = require('../helpers/dbValidators');
const {fieldsValidation} = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');

const router = Router();

router.get('/:idService',[
    jwtValidation,
    
],getPosts);
router.post('/',[
    jwtValidation,
    check('caption',' string no vacío').isString().notEmpty(),
    check('photo','type invalid').isString().notEmpty(),
    check('description',' invalid').isString().notEmpty(),
    check('idService',' invalid').isMongoId().notEmpty().custom(serviceIdValid),
    fieldsValidation
],postPost);

router.put('/:id',[
    jwtValidation
],putPost);


router.delete('/:id',[
    jwtValidation,
    check('id','id tienes que ser un id de mongo').isMongoId(),
    fieldsValidation
],deletePost)
router.post('/:id',[
    jwtValidation,
    check('id','id tienes que ser un id de mongo').isMongoId().custom(serviceIdValid),
    fieldsValidation
],pruebaPostImages);

module.exports = router;