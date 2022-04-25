/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const {getPosts,postPost,putPost,deletePost,pruebaPostImages} = require('../controllers/post');
const { serviceIdValid, postIdValid } = require('../helpers/dbValidators');
const {fieldsValidation} = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');
const { extensionValidation,validationFilePost } = require('../middlewares/upload');

const router = Router();

router.get('/:idService',[
    jwtValidation,
    check('idService','invalid').isMongoId().custom(serviceIdValid),
    fieldsValidation
    
],getPosts);
router.post('/:id',[
    jwtValidation,
    check('caption',' string no vacío').isString().notEmpty(),
    check('description',' invalid').isString().notEmpty(),
    check('id',' invalid').isMongoId().notEmpty().custom(serviceIdValid),
    fieldsValidation
],postPost);

router.put('/:id',[
    jwtValidation,
    check('id','id tienes que ser un id de mongo').isMongoId().custom(postIdValid),
    check('caption',' string no vacío').optional().isString().notEmpty(),
    check('description',' invalid').optional().isString().notEmpty(),
    fieldsValidation
],putPost);


router.delete('/:id',[
    jwtValidation,
    check('id','id tienes que ser un id de mongo').isMongoId().custom(postIdValid),
    fieldsValidation
],deletePost)

// router.post('/:id',[
//     jwtValidation,
//     extensionValidation,
//     check('id','id tienes que ser un id de mongo').isMongoId().custom(serviceIdValid),
    
//     fieldsValidation
// ],pruebaPostImages);

module.exports = router;