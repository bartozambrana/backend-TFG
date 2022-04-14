/** requirements - thrid party **/
const {Router} = require('express');
const {check} = require('express-validator');

/** Local requirements **/
const { fieldsValidation } = require('../middlewares/fieldsValidation');
const jwtValidation= require('../middlewares/jwtValidation')
const { 
    getAllDatesUser, 
    getDatesAvaliablesService, 
    postDate, 
    deleteDate, 
    putSelectDateUser, 
    putModifyDate, 
    putCancelDate ,
    putDate,
    getDatesPDF
} = require('../controllers/date');

const { serviceIdValid, dateIdValid, validHourFormat} = require('../helpers/dbValidators');
const dateValidation = require('../middlewares/dateValidation');

/** Global constants **/
const router = Router();

// All dates of a user.
router.get('/',[
    jwtValidation,
    fieldsValidation
], getAllDatesUser );

// All dates avaliable for a bussiness for a day in a month and year
router.get('/:idService',[
    jwtValidation,
    check('idService','invalid').isMongoId().custom(serviceIdValid),
    check('dateInput','invalid').isDate().notEmpty(),
    fieldsValidation
], getDatesAvaliablesService)

router.get('/asignated/:idService',[
    jwtValidation,
    check('idService','invalid').isMongoId().custom(serviceIdValid),
    check('dateInput','invalid').isDate().notEmpty(),
    fieldsValidation
], getDatesAvaliablesService)

// Add a new date from a service.
router.post('/',[
    jwtValidation,
    check('dateDay','invalid type').isDate().notEmpty(),
    check('initHour','invalid type').isString().notEmpty().custom(validHourFormat),
    check('endHour','invalid type').isString().notEmpty().custom(validHourFormat),
    check('idService','invalid').isMongoId().custom(serviceIdValid),
    check('status').optional().isBoolean(),
    fieldsValidation
], postDate);


// Modify date owner
router.put('/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().custom(dateIdValid),
    check('date','invalid type').optional().isDate().notEmpty(),
    check('initHour','invalid type').optional().isString().notEmpty().custom(validHourFormat),
    check('endHour','invalid type').optional().isString().notEmpty().custom(validHourFormat),
    check('status').optional().isBoolean(),
    dateValidation,
    fieldsValidation
], putDate);

//User select Date
router.put('/select/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().custom(dateIdValid),
    dateValidation,
    fieldsValidation
], putSelectDateUser);

//User modify Date
router.put('/modify/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().notEmpty().custom(dateIdValid),
    check('idOldDate').isMongoId().notEmpty().custom(dateIdValid),
    dateValidation,
    fieldsValidation
], putModifyDate);

router.put('/cancel/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().notEmpty().custom(dateIdValid),
    fieldsValidation
], putCancelDate);


// canceling an appointment (dar de baja) owner.
router.delete('/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().custom(dateIdValid),
    fieldsValidation
], deleteDate);

// Generate a PDF.

router.get('/pdf/:id',[
    jwtValidation,
    check('id','invalid').isMongoId().custom(serviceIdValid),
    check('initDate','invalid date').isDate().notEmpty(),
    check('endDate','invalid date').isDate().notEmpty(),
    fieldsValidation
],getDatesPDF)
module.exports = router;