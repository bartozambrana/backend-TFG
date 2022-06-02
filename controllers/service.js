const Service = require('../models/services')
const User = require('../models/users')
const Work = require('../models/works')
const Post = require('../models/posts')
const deleteServiceElements = require('../helpers/deleteService')
const { request } = require('express')
const { default: mongoose } = require('mongoose')

//Obtemos los datos de un determinado servicio.
const getService = async (req, res) => {
    try {
        const { id } = req.params

        const service = await Service.findById(id)

        res.json({
            success: true,
            service,
        })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}

//Se encarga de devolver los servicios de un determinado usuario.
const getServicesUser = async (req, res) => {
    try {
        const services = await Service.find({ idUser: req.uid })

        res.json({
            success: true,
            services,
        })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}
//Se encarga de añadir un nuevo servicio al sistema.
const postService = async (req, res) => {
    try {
        const {
            serviceCategory,
            serviceInfo,
            serviceName,
            cityName,
            street,
            postalCode,
        } = req.body

        //Obtenemos el usuario que esta creando el servicio.
        const user = await User.findById(req.uid)

        // Verificamos que un usuario no pueda crear  un servicio.
        if (user.type) {
            const localization = { cityName, street, postalCode }

            //Creamos la instancia del servicio.
            const service = new Service({
                serviceCategory,
                serviceInfo,
                serviceName,
                localization,
                idUser: req.uid,
            })

            //Save service en DB.
            await service.save()

            return res.json({
                success: true,
                user,
                service,
            })
        }
        res.json({
            msg: 'This user is type client',
            success: false,
        })
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}
const putService = async (req, res) => {
    try {
        const { id } = req.params
        //Verificamos si el id pasado corresponde al negocio que el usuario es propietario.
        const service = await Service.findById(id)
        //Establecemos el formato correcto de la localización y lo guardamos en el sistema.
        //Verficando previamente que el usuario es el dueño del servicio.
        if (service && service.idUser == req.uid) {
            const { idUser, ...rest } = req.body

            rest.localization = service.localization

            if (rest.cityName) rest.localization.cityName = rest.cityName
            if (rest.street) rest.localization.street = rest.street
            if (rest.postalCode) rest.localization.postalCode = rest.postalCode

            const updatedService = await Service.findByIdAndUpdate(id, rest, {
                new: true,
            })

            return res.json({
                success: true,
                service: updatedService,
            })
        }
        res.json({
            success: false,
            msg: 'The user is not the director',
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}
//Método encargado de establecer si un usuario sigue o deja de serguir un determinado servicio.
const postFollowService = async (req, res) => {
    const { id } = req.params
    try {
        const exits = await User.findOne({
            _id: req.uid,
            followServices: { $in: [id] },
        })

        if (!exits) {
            await User.findByIdAndUpdate(req.uid, {
                $push: { followServices: id },
            })

            return res.json({
                success: true,
                followService: true,
            })
        }

        await User.findByIdAndUpdate(req.uid, {
            $pull: { followServices: id },
        })

        return res.json({
            success: true,
            followService: false,
        })
    } catch (error) {
        res.status(500).json({
            msg: error,
            success: false,
        })
    }
}

//Método encargado de mandar las categorías establecidas en los servicios.
//de modo que se permita realizar un filtrado de servicios por categorías.
const obtainCategoriesAvaliables = async (req, res) => {
    try {
        const services = await Service.find().select('serviceCategory -_id')
        //Objects Array to Array
        const categories = services.map((service) => {
            return service.serviceCategory
        })
        //Filter duplicates elements
        const avaliablesCategories = [...new Set(categories)]
        //Return response
        res.json({ success: true, categories: avaliablesCategories })
    } catch (error) {
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}

//Método para proporcionar las categorías dadas de alta en el sistema.
const validCategories = async (req, res) => {
    res.json({
        success: true,
        categories: [
            'eletrónica',
            'mecánica',
            'auditoría-asesoría',
            'aseguradoras',
            'peluquería',
            'dentistas',
            'moda',
        ],
    })
}
//Método encargado de obtner todos los servicios del sistema.
const obtainAllServices = async (req, res) => {
    try {
        servicesList = await Service.find()
        res.json({ success: true, services: servicesList })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}
//Méotod encargado de obtener un conjunto de servicios mediante una consulta.
const obtainServicesQuery = async (req = request, res) => {
    try {
        const { categories, population, name } = req.query
        const categoriesList = categories.split(';')
        let services = []
        //Obtenemos los servicios mediante la categoria mandadas
        if (categories) {
            services = await Service.find({
                status: true,
                serviceCategory: { $in: categoriesList },
            })
        } else {
            services = await Service.find({ status: true })
        }

        //Filtaramos aquellos que no mantengan la población
        services = services.filter((s) => {
            return (
                s.localization.cityName.toLowerCase().includes(population) &&
                s.serviceName.toLowerCase().includes(name)
            )
        })

        return res.json({ services, success: true })
    } catch (error) {
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}
//Método encargado de la eliminación de un determinado servicio.
const deleteService = async (req, res) => {
    try {
        const { id } = req.params
        //Verify that the user is the bussinnes onwer.
        const service = await Service.findById(id)
        if (service.idUser != req.uid)
            return res.status(400).json({
                success: false,
                msg: `User does not have that business`,
            })

        await deleteServiceElements(id)

        await Service.findByIdAndDelete(id, { state: false })
    } catch (error) {
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}
//Método encargado de obtener un número de servicios random.
//que no hayan sido servidos previamente.
const getServicesRandom = async (req, res) => {
    try {
        const { amount = 10, servicesSended } = req.query
        const numServices = await Service.count({ status: true })

        if (Number(amount) > numServices) amount = numServices

        let services = []
        if (servicesSended) {
            //Formamos un array con los servicios que han sido enviados.
            const servicesList = servicesSended.split(';')
            services = await Service.aggregate([
                {
                    $match: {
                        status: true,
                        _id: {
                            $nin: servicesList.map(
                                (service) =>
                                    new mongoose.Types.ObjectId(service)
                            ),
                        },
                    },
                },
                { $sample: { size: Number(amount) } },
                {
                    $project: {
                        _id: {
                            $cond: {
                                if: { $ne: ['', '$_id'] },
                                then: '$$REMOVE',
                                else: '$_id',
                            },
                        },
                        uid: '$_id',
                        serviceInfo: '$serviceInfo',
                        serviceName: '$serviceName',
                        localization: '$localization',
                    },
                },
            ])
        } else {
            services = await Service.aggregate([
                { $match: { status: true } },
                { $sample: { size: Number(amount) } },
                {
                    $project: {
                        _id: {
                            $cond: {
                                if: { $ne: ['', '$_id'] },
                                then: '$$REMOVE',
                                else: '$_id',
                            },
                        },
                        uid: '$_id',
                        serviceInfo: '$serviceInfo',
                        serviceName: '$serviceName',
                        localization: '$localization',
                    },
                },
            ])
        }

        //Al filtrar los documentos repetidos puede obtener un undefined si se devuelven todos los servicios.
        if (!services) services = []

        res.json({ success: true, services })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'contact with admin', success: false })
    }
}

module.exports = {
    getService,
    putService,
    deleteService,
    postService,
    postFollowService,
    obtainCategoriesAvaliables,
    obtainAllServices,
    obtainServicesQuery,
    validCategories,
    getServicesUser,
    getServicesRandom,
}
