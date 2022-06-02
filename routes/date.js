/** requirements - thrid party **/
const { Router } = require('express')
const { check } = require('express-validator')

/** Local requirements **/
const { fieldsValidation } = require('../middlewares/fieldsValidation')
const jwtValidation = require('../middlewares/jwtValidation')
const {
    getAllDatesUser,
    getDatesAvaliablesService,
    getAsignedDates,
    postDate,
    deleteDate,
    putSelectDateUser,
    putModifyDate,
    putCancelDate,
    putDate,
    getDatesPDF,
    postValorationDate,
    getRating,
} = require('../controllers/date')

const {
    serviceIdValid,
    dateIdValid,
    validHourFormat,
} = require('../helpers/dbValidators')

const dateValidation = require('../middlewares/dateValidation')

/** Global constants **/
const router = Router()

router.get('/', [jwtValidation], getAllDatesUser)

router.get(
    '/:idService',
    [
        jwtValidation,
        check('idService', 'invalid').isMongoId().custom(serviceIdValid),
        check('dateInput', 'Fecha inválida').isDate().notEmpty(),
        fieldsValidation,
    ],
    getDatesAvaliablesService
)

router.get(
    '/asignated/:idService',
    [
        jwtValidation,
        check('idService', 'invalid').isMongoId().custom(serviceIdValid),
        check('dateInput', 'invalid').isDate().notEmpty(),
        fieldsValidation,
    ],
    getAsignedDates
)

router.get(
    '/rating/:id',
    [jwtValidation, check('id', 'id invalid').isMongoId().custom(dateIdValid)],
    getRating
)

router.post(
    '/:idService',
    [
        jwtValidation,
        check('dateDay', 'invalid type').isDate().notEmpty(),
        check('initHour', 'invalid type')
            .isString()
            .notEmpty()
            .custom(validHourFormat),
        check('endHour', 'invalid type')
            .isString()
            .notEmpty()
            .custom(validHourFormat),
        check('status').optional().isBoolean(),
        fieldsValidation,
    ],
    postDate
)

router.put(
    '/:id',
    [
        jwtValidation,
        check('id', 'invalid').isMongoId().custom(dateIdValid),
        check('date', 'invalid type').optional().isDate().notEmpty(),
        check('initHour', 'invalid type')
            .optional()
            .isString()
            .notEmpty()
            .custom(validHourFormat),
        check('endHour', 'invalid type')
            .optional()
            .isString()
            .notEmpty()
            .custom(validHourFormat),
        check('status').optional().isBoolean(),
        fieldsValidation,
    ],
    putDate
)

router.put(
    '/select/:id',
    [
        jwtValidation,
        check('id', 'invalid').isMongoId().custom(dateIdValid),
        dateValidation,
        fieldsValidation,
    ],
    putSelectDateUser
)

router.put(
    '/modify/:id',
    [
        jwtValidation,
        check('id', 'invalid').isMongoId().notEmpty().custom(dateIdValid),
        check('idOldDate').isMongoId().notEmpty().custom(dateIdValid),
        dateValidation,
        fieldsValidation,
    ],
    putModifyDate
)

router.put(
    '/cancel/:id',
    [
        jwtValidation,
        check('id', 'invalid').isMongoId().notEmpty().custom(dateIdValid),
        fieldsValidation,
    ],
    putCancelDate
)

router.delete(
    '/:id',
    [
        jwtValidation,
        check('id', 'invalid').isMongoId().custom(dateIdValid),
        fieldsValidation,
    ],
    deleteDate
)

router.post(
    '/valoration/:id',
    [
        jwtValidation,
        check('id', 'invalidId').isMongoId().custom(dateIdValid),
        check('valoration', 'is a number').isNumeric(),
    ],
    postValorationDate
)

router.get(
    '/pdf/:id',
    [
        jwtValidation,
        check('id', 'invalid').isMongoId().custom(serviceIdValid),
        check('initDate', 'invalid date').isDate().notEmpty(),
        check('endDate', 'invalid date').isDate().notEmpty(),
        fieldsValidation,
    ],
    getDatesPDF
)
module.exports = router
