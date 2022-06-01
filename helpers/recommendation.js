//Dadas dos listas calcula el coeficiente de pearson entre ambas.

const { request } = require('express')
const { default: mongoose } = require('mongoose')
const Dates = require('../models/dates')
const Services = require('../models/services')

const pearson = (x, y) => {
    let sum1 = 0
    let sum2 = 0
    let sum3 = 0

    const sumX = x.reduce((acc, curr) => acc + curr, 0)
    const sumY = y.reduce((acc, curr) => acc + curr, 0)
    const n = x.length

    for (let i = 0; i < x.length; i++) {
        //Numerador.
        sum1 += x[i] * y[i]

        //Denominador.
        sum2 += x[i] * x[i]
        sum3 += y[i] * y[i]
    }

    const numerador = n * sum1 - sumX * sumY
    let denominador =
        Math.sqrt(n * sum2 - sumX * sumX) * Math.sqrt(n * sum3 - sumY * sumY)

    // Evitamos de que suceda un 0/0, ya que realmente el resultado es 0, de ahí que
    // de igual que el denominador sea 1.

    // Es decir no hay un correlación lineal, pero no quiere decir que haya alguna no lineal.

    if (denominador === 0) denominador = 1

    return numerador / denominador
}

// Se encarga de obtener los coeficientes de pearson de todos los usuarios, para nuestro usuario.
/*
	@param previousValorations: Array de objetos que contiene, cada entrada se corresponde a un usuario.
								[
									{	idUser,
										valorations:[{idService,valoration}]
								}
								,....]
	@param userValoration: Array de objetos que contine la valoración para cada servicio. [{idService,valoration},...]
	@return devolvemos un array de objetos, idUser -> pearson.
*/
const obtainPearson = (usersValorations, currentUserValorations) => {
    let pearsonCoeficients = []

    //Recorremos todos los usuarios.
    for (const user of usersValorations) {
        //console.log('User: ', user)
        let listRandomUser = []
        let listUser = []
        let filtrado = []

        //Obtenemos las valoraciones de forma de que los dos usuarios presenten los mismos elementos.
        for (const valoration of user.valorations) {
            //filtramos las valoraciones para realizar la intersección de modo que ambas
            //listas tengan el mismo tamaño de población.
            filtrado.push(
                ...currentUserValorations.filter(
                    (v) => v.idService === valoration.idService
                )
            )
        }

        // Servicios comunes.
        const services = filtrado.map((e) => e.idService)

        // Puede darse el caso que el usuario tenga más elementos que el otro usuario random no posea, dichos elementos
        // hemos de depreciarlos.
        listUser = currentUserValorations
            .filter((e) => services.includes(e.idService))
            .map((valoration) => valoration.valoration)

        //Obtenemos la valoración de cada elemento.
        listRandomUser.push(...filtrado.map((e) => e.valoration))

        const pearsonUser = pearson(listUser, listRandomUser)

        pearsonCoeficients.push({ idUser: user.idUser, pearsonUser })
    }

    return pearsonCoeficients
}

// Obtenemos los tres usuarios con mejor coeficiente de pearson.
const neighborhood = (pearsonCoeficients, nNeighborhoods) => {
    //Ordenamos los coeficientes de pearson de mayor a menor.
    pearsonCoeficient = pearsonCoeficients.map((e) => ({
        ...e,
        pearsonUser: Math.abs(e.pearsonUser),
    }))

    const sorted = pearsonCoeficients.sort(
        (a, b) => b.pearsonUser - a.pearsonUser
    )

    //Obtenemos los tres primeros usuarios.
    let neighborhood = sorted.slice(0, nNeighborhoods)

    neighborhood = neighborhood.map((user) => user.idUser)

    return neighborhood
}

// Obtenemos la recomendación
const recommendation = (
    neighborhood,
    visitedServices,
    usersValorations,
    nResults
) => {
    let recommendation = []

    //Recorremos todos los servicios que el usuario no ha visitado.
    usersValorations.map((item) => {
        if (neighborhood.includes(item.idUser)) {
            //Recomendamos aquel servicio que el usuario no ha visitado y la valoración es mayor a 4.5
            for (const valoration of item.valorations) {
                if (
                    !visitedServices.includes(valoration.idService) &&
                    !recommendation.includes(valoration.idService) &&
                    valoration.valoration >= 4
                ) {
                    recommendation.push(valoration.idService)
                }
            }
        }
    })

    //Devolvemos la recomendación.
    return recommendation.slice(0, nResults)
}

//Obtain userValorations.
const valorations = async (req = request, res) => {
    try {
        //uid -> idUser
        const uid = req.uid

        // Obtenemos las valoraciones del usuario, sacando la media de las valoraciones a dicho servicio,
        // ya que puede darse el caso de que haya valorado varias veces el mismo servicio.
        // Realizamos ambas consultas a la misma vez.
        let [currentUserValorations, usersValorations] = await Promise.all([
            Dates.aggregate([
                {
                    $match: {
                        idUser: new mongoose.Types.ObjectId(uid),
                        status: false,
                    },
                },
                {
                    $group: {
                        _id: '$idService',
                        average: { $avg: '$valoration' },
                    },
                },
                {
                    $project: {
                        idService: { $toString: '$_id' },
                        valoration: '$average',
                        _id: {
                            $cond: {
                                if: { $ne: ['', '$_id'] },
                                then: '$$REMOVE',
                                else: '$_id',
                            },
                        },
                    },
                },
            ]),
            Dates.aggregate([
                {
                    $match: {
                        status: false,
                        idUser: { $ne: new mongoose.Types.ObjectId(uid) },
                    },
                },
                {
                    $group: {
                        _id: { idUser: '$idUser', idService: '$idService' },
                        average: { $avg: '$valoration' },
                    },
                },
                {
                    $project: {
                        idUser: { $toString: '$_id.idUser' },
                        idService: { $toString: '$_id.idService' },
                        valoration: '$average',
                        _id: {
                            $cond: {
                                if: { $ne: ['', '$_id'] },
                                then: '$$REMOVE',
                                else: '$_id',
                            },
                        },
                    },
                },
                {
                    $sort: { idUser: -1 },
                },
            ]),
        ])

        //Transformación a la estructura de datos necesaria.
        /*
			[
				{
					idUser: mongoose.Types.ObjectId(uid),
					valorations: [
						{
							idService: mongoose.Types.ObjectId(idService),
							valoration
						},
				    ...]
				}
				.
				.
				.
			] 
		*/
        const visitedServices = currentUserValorations.map(
            (item) => item.idService
        )

        let added = []
        usersValorations = usersValorations
            .map((item) => {
                const valorations = usersValorations
                    .filter(
                        (item2) =>
                            item2.idUser === item.idUser &&
                            !added.includes(item.idUser)
                    )
                    .map((e) => ({
                        idService: e.idService,
                        valoration: e.valoration,
                    }))
                added.push(item.idUser)

                return { idUser: item.idUser, valorations }
            })
            .filter((e) => e.valorations.length !== 0)
        return [currentUserValorations, usersValorations, visitedServices]
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}

const recommendedServices = async (req, res) => {
    try {
        const n = req.params.n
        if (n < 0)
            return res
                .status(400)
                .json({ success: false, msg: 'n must be greater than 0' })

        //Obtenemos los datos necesarios para realizar la recomendación.
        const [currentUserValorations, usersValorations, visitedServices] =
            await valorations(req, res)

        //Obtenemos los coeficientes de pearson.
        const pearson = obtainPearson(usersValorations, currentUserValorations)
        //Obtenemos el vecindario.
        const nei = neighborhood(pearson, 5)
        //Obtenemos la recomendación.
        const finalRecommendation = recommendation(
            nei,
            visitedServices,
            usersValorations,
            n
        )
        //Devolvemos la información necesaria acerca dichos servicios.
        const services = await Services.find({
            _id: { $in: finalRecommendation },
        })

        return services
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, msg: 'Contact with the admin' })
    }
}

module.exports = {
    recommendedServices,
}
