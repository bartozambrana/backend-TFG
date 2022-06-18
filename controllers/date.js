/* Global requiremnts */
const { request, response } = require('express')

/* Local requirements */
const Service = require('../models/services')
const Dates = require('../models/dates')
const User = require('../models/users')

const {
    sendIndividualEmail,
    sendDatesBussinessMan,
} = require('../helpers/sendEmail')
const { createPdfDocument, cleanPDF } = require('../helpers/upload')
const path = require('path')
const fs = require('fs')

const { default: mongoose } = require('mongoose')

//Método encargado de traspasar una hora de formato 12h a 24h a número 0-1440
const hourToInteger = (hour) => {
    const elements = hour.split(':')
    return parseInt(elements[0]) * 60 + parseInt(elements[1])
}

//Se encarga de obtener todas fechas de un determinado usuario, ordenándolas de más
//recientes a menos recientes.
const getAllDatesUser = async (req = request, res = response) => {
    try {
        const userDates = await Dates.find({ idUser: req.uid })
            .sort({ date: -1 })
            .populate({ path: 'idService', select: 'serviceName' })

        res.json({
            success: true,
            userDates,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'contact with the admin',
        })
    }
}

//Método encargado de obtener las citas disponibles de un determinado servicio
//para una determinad fecha.
const getDatesAvaliablesService = async (req = request, res = response) => {
    const { dateInput } = req.query
    const { idService } = req.params

    try {
        const dateQuery = new Date(dateInput) //Creamos la fecha, para realizar la petición
        const dates = await Dates.find({
            idService,
            date: dateQuery,
            status: true,
        })
        res.json({ success: true, dates })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}

//Método encargado de responder con todas la fechas asignadas para un determinado
//servicio para una determinada fecha.
const getAsignedDates = async (req = request, res = response) => {
    const { dateInput } = req.query
    const { idService } = req.params

    //Verify that the user is the service owner.
    try {
        const service = await Service.findById(idService)
        if (service.idUser != req.uid) {
            return res.status(400).json({
                success: false,
                msg: 'the user is not the owner service',
            })
        }
        const dateQuery = new Date(dateInput)
        const dateList = await Dates.find({
            idService,
            date: dateQuery,
            status: false,
        }).populate({ path: 'idUser', select: 'userName -_id' })
        res.json({ success: true, dates: dateList })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}

//Método encargado de crear una nueva cita.
const postDate = async (req = request, res = response) => {
    try {
        const { idService } = req.params
        const { dateDay, status } = req.body
        let { initHour, endHour } = req.body

        //Creamos las horas en el formato correcto.
        initHour = hourToInteger(initHour)
        endHour = hourToInteger(endHour)

        if (initHour >= endHour) {
            return res.status(400).json({
                msg: 'hours definied are invalid',
                success: false,
            })
        }
        //Verificamos que el usuario es el dueño del servicio.
        const service = await Service.findById(idService)
        if (service.idUser != req.uid) {
            return res.status(400).json({
                msg: 'User is not the onwer',
                success: false,
            })
        }
        //Creamos la nueva cita.
        let newDate = ''
        if (status) {
            newDate = new Dates({
                date: new Date(dateDay),
                initHour,
                endHour,
                idService,
                status,
            })
        } else {
            newDate = new Dates({
                date: new Date(dateDay),
                initHour,
                endHour,
                idService,
            })
        }

        await newDate.save()

        res.json({ success: true, date: newDate })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}

//Actualización de un cita.
const putDate = async (req = request, res = response) => {
    try {
        const { id } = req.params
        const service = await Dates.findById(id).populate('idService')
        if (service.idService.idUser != req.uid) {
            return res.status(400).json({
                success: false,
                msg: 'the user is not the owner service',
            })
        }

        if (!service.status) {
            return res.status(400).json({
                success: false,
                msg: 'the appointment is assigned, you cannot update it now',
            })
        }

        let { initHour, endHour, ...rest } = req.body
        if (initHour) {
            initHour = hourToInteger(initHour)
            if (initHour > service.endHour)
                return res
                    .status(400)
                    .json({ success: false, msg: 'initHour > endHour' })

            rest.initHour = initHour
        }

        if (endHour) {
            endHour = hourToInteger(endHour)
            if (endHour < service.initHour)
                return res
                    .status(400)
                    .json({ success: false, msg: 'endHour < initHour' })

            rest.endHour = endHour
        }

        if (rest.date) {
            rest.date = new Date(res.date)
        }

        const dateUpdated = await Dates.findByIdAndUpdate(id, rest, {
            new: true,
        })
        res.json({ success: true, date: dateUpdated })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}

//Selección de una cita por parte de un suaurio.
const putSelectDateUser = async (req = request, res = response) => {
    const { id } = req.params
    try {
        //Seleccionamos la cita.
        const dateUpdated = await Dates.findByIdAndUpdate(
            id,
            { status: false, idUser: req.uid },
            { new: true }
        ).populate('idUser')
        //Le enviamos el email al usuario como que la cita ha sido seleccionada.
        sendIndividualEmail({
            subject: 'Cita Seleccionada',
            toEmail: dateUpdated.idUser.email,
            text: `Se ha establecido su cita para el día, ${dateUpdated.date.getDate()}-${
                dateUpdated.date.getMonth() + 1
            }-${dateUpdated.date.getFullYear()}`,
            header: 'Notificación de selección de cita',
        })
        delete dateUpdated.idUser
        dateUpdated.idUser = req.uid
        res.json({ success: true, date: dateUpdated })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}

// El usaurio desea cambiar una cita por otra.
const putModifyDate = async (req = request, res = response) => {
    const { id } = req.params
    const { idOldDate } = req.body

    try {
        //liberamos la cita anterior, puede realizarse asíncrono.
        await Dates.findByIdAndUpdate(idOldDate, {
            status: true,
            $unset: { idUser: '' },
        })
        //Establecemos nueva cita.
        const dateUpdated = await Dates.findByIdAndUpdate(
            id,
            { status: false, idUser: req.uid },
            { new: true }
        )
            .populate('idUser')
            .populate({ path: 'idService', select: 'serviceName' })
        //Enviamos el email al usuario con la cita modificada.
        sendIndividualEmail({
            subject: 'Cita Modificada',
            toEmail: dateUpdated.idUser.email,
            text: `Se ha actualizado su cita para el día, ${dateUpdated.date.getDate()}-${
                dateUpdated.date.getMonth() + 1
            }-${dateUpdated.date.getFullYear()}`,
            header: 'Notificación de modificación de cita',
        })

        delete dateUpdated.idUser
        dateUpdated.idUser = req.uid
        res.json({ success: true, date: dateUpdated })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}
//Anulación de una cita.
const putCancelDate = async (req = request, res = response) => {
    const { id } = req.params

    try {
        const date = await Dates.findById(id).populate('idService')
        //Comprobamos si el usuario es el empresario o el dueño de la cita.
        if (date.idUser == req.uid || date.idService.idUser == req.uid) {
            const dateUpdated = await Dates.findByIdAndUpdate(id, {
                status: true,
                $unset: { idUser: '' },
            })
            const user = await User.findById(dateUpdated.idUser)
            //MANDA EL EMAIL AL USUARIO
            sendIndividualEmail({
                subject: 'Cita Cancelada',
                toEmail: user.email,
                text: `Se ha cancelado su cita para el día, ${dateUpdated.date.getDate()}-${
                    dateUpdated.date.getMonth() + 1
                }-${dateUpdated.date.getFullYear()}`,
                header: 'Notificación de cancelación de cita',
            })
            return res.json({ success: true, msg: 'Date cancelled.' })
        }
        return res.status(400).json({
            success: false,
            msg: 'you are not the owner of that appointment',
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}

//Eliminar una cita del sistema, por parte del empresario.
const deleteDate = async (req = request, res = response) => {
    const { id } = req.params
    try {
        const date = await Dates.findById(id).populate('idService')
        if (date.idService.idUser == req.uid) {
            await Dates.findByIdAndDelete(id)
            return res.json({ success: true, msg: 'Date deleted.' })
        }

        return res
            .status(500)
            .json({ success: false, msg: 'you are not the owner bussiness' })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}

const getDatesPDF = async (req = request, res = response) => {
    //Verify user is the bussiness owner.
    const { id } = req.params

    const service = await Service.findById(id).populate('idUser')

    if (service.idUser.id != req.uid)
        return res.status(400).json({
            success: false,
            msg: 'You are not the user owner of this businnes',
        })

    const initDate = new Date(req.query.initDate)
    const endDate = new Date(req.query.endDate)

    const dateList = await Dates.find({
        date: { $gte: initDate },
        date: { $lte: endDate },
        status: false,
    }).populate({ path: 'idUser', select: 'userName email -_id' })

    if (dateList.length !== 0) {
        const nameFile = await createPdfDocument(dateList)
        const filePath = path.join(__dirname, '../pdfs', nameFile)
        const toEmail = service.idUser.email

        await sendDatesBussinessMan({ toEmail, nameFile })
        cleanPDF(nameFile)
        return res.json({
            success: true,
            msg: 'Dates send by email',
        })
    }

    return res.json({ success: true, msg: 'No dates found' })
}

//Se encarga de añadir una valoración a una cita del sistema.
const postValorationDate = async (req = request, res = response) => {
    const { id } = req.params
    const { valoration } = req.body
    //Verificamos que el usuario sea el dueño de la cita.
    let date = await Dates.findById(id)
    if (date.idUser != req.uid)
        return res.status(400).json({
            success: false,
            msg: 'you dont had that appointment',
        })

    if (date.valoration)
        return res.status(400).json({
            success: false,
            msg: 'you have a valoration for that date yet',
        })

    date = await Dates.findByIdAndUpdate(
        id,
        { valoration },
        { new: true }
    ).populate({ path: 'idService', select: ' serviceName ' })
    res.json({ success: true, date })
}

//Se encagar de establecer la valoración média de un determinado serciio.
const getRating = async (req, res) => {
    try {
        const { id } = req.params

        const ratingAvg = await Dates.aggregate([
            { $match: { idService: new mongoose.Types.ObjectId(id) } },
            {
                $group: {
                    _id: '$idService',
                    average: { $avg: '$valoration' },
                },
            },
        ])

        if (!ratingAvg.length === 0)
            return res.json({ success: true, rating: 'NS' })

        res.json({ success: true, rating: ratingAvg[0].average })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'contact with the admin' })
    }
}

module.exports = {
    getAllDatesUser,
    getDatesAvaliablesService,
    postDate,
    putModifyDate,
    putSelectDateUser,
    putCancelDate,
    putDate,
    deleteDate,
    getAsignedDates,
    getDatesPDF,
    postValorationDate,
    getRating,
}
