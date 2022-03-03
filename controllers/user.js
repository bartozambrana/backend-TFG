const {response,request} = require('express');

const getUser = (req = request, res = response) =>{
    const {id} = req.params;
    res.json({
        msg:'Get API - Controller - Get User',
        id: id
    })
}

const putUser = (req = request, res = response) => {
    const {id} = req.params;
    res.json({
        msg:'Put API - Controller - Update User ',
        id : id
    })
}

const postUser = (req = request, res = response) => {
    res.json({
        msg:'Post API - Controller'
    })
}

const deleteUser = (req = request, res = response) => {
    const {id} = req.params;
    res.json({
        msg:'Delete API - Controller - Delete User',
        id: id
    })
}

module.exports = {
    getUser,
    putUser,
    postUser,
    deleteUser
}