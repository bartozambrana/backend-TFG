const {Router} = require('express');
const {getUser,putUser,postUser,deleteUser} = require('../controllers/user');

const router = Router();

router.get('/:id', getUser);      //Obtain the user information.
router.put('/:id', putUser);      //Update user :id.
router.post('/',postUser);        //New user.

router.delete('/:id',deleteUser); //Delete user :id.

module.exports = router;