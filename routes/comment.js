/** requirements **/
const {Router} = require('express');
const {check} = require('express-validator');

const router = Router();

/** Local requirements **/
const {
    getComments,
    postComments,
    deleteComments,
    postReplyTo,
    putComment
} = require('../controllers/comment');

const { 
    serviceIdValid, 
    isUserOrService,
    commentIdValid, 
} = require('../helpers/dbValidators');

const { fieldsValidation } = require('../middlewares/fieldsValidation');
const jwtValidation = require('../middlewares/jwtValidation');

router.get('/',[
    jwtValidation,
],getComments);

router.put('/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().notEmpty(),
    check('text','invalid').isString().notEmpty(),
    fieldsValidation
],putComment);

router.post('/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().custom(serviceIdValid),
    check('text','invalid').isString().notEmpty(),
    fieldsValidation
],postComments);

router.post('/reply/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().custom(commentIdValid),
    check('text','invalid').isString().notEmpty(),
    fieldsValidation
],postReplyTo);

router.delete('/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().notEmpty(),
    fieldsValidation
],deleteComments);


module.exports = router;