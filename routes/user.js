/** requirements - thrid party **/
const { Router } = require('express')
const { check } = require('express-validator')

/** Local requirements **/
const {
    getUser,
    putUser,
    postUser,
    deleteUser,
    getRandomContent,
    getRecommendations,
} = require('../controllers/user')
const { emailValid, userNameValid } = require('../helpers/dbValidators')
const { fieldsValidation } = require('../middlewares/fieldsValidation')
const jwtValidation = require('../middlewares/jwtValidation')

const router = Router()

router.get('/', [jwtValidation], getUser)
router.put(
    '/',
    [
        jwtValidation,
        check('email', 'email incorrecto')
            .optional()
            .isEmail()
            .notEmpty()
            .custom(emailValid),
        check('type', ' type incorrecto').optional().isBoolean(),
        check('password', 'contraseña incorrecta')
            .optional()
            .isString()
            .notEmpty(),

        check('userName', 'nombre de usuario incorrecto')
            .optional()
            .isString()
            .notEmpty()
            .custom(userNameValid),
        fieldsValidation,
    ],
    putUser
)
router.post(
    '/',
    [
        check('email', 'email not valid')
            .isEmail()
            .notEmpty()
            .custom(emailValid),
        check('userName', 'user name invalid')
            .isString()
            .notEmpty()
            .custom(userNameValid),
        check('password', 'password invalid').isString().notEmpty(),
        check('type', 'type invalid').isBoolean().notEmpty(),
        fieldsValidation,
    ],
    postUser
)
router.delete('/', [jwtValidation], deleteUser) //Delete user :id.

router.get('/randomContent/', [jwtValidation], getRandomContent)

router.get(
    '/recommendations/:n',
    [
        jwtValidation,
        check('n', 'number').isNumeric().notEmpty(),
        fieldsValidation,
    ],
    getRecommendations
)

module.exports = router
