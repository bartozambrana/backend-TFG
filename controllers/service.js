

const Service = require("../models/services");
const User = require("../models/users");


const getService = async(req,res)=>{
    //hay que añadirle que devuelva los primeros comentarios y posts.
    const {id} = req.params;
    
    //Verify that the user request your service
    const service = await Service.find({_id:id, idUser:req.uid}).populate('idUser');

    if(service.length != 0){
        return res.json({
            success:true,
            service
        });
    }

    res.json({
        msg:`User with id ${req.uid} does not have that business`,
        success: false
    })

}


const postService = async(req,res)=>{

    const{serviceCategory,serviceInfo,serviceName,
        cityName, street, postalCode,idUser} = req.body;

    //Obtain user object from idUser.
    const user = await User.findById({_id:idUser});

    //Verify if he or she is a business men
    if(user.type){

        const localization = {cityName,street,postalCode}

        //Create de Service instace
        const service = new Service({serviceCategory,serviceInfo,serviceName,localization,idUser});

        //Save service en DB.
        await service.save()
        
        return res.json({
            success:true,
            user,
            service
        });
    }
    res.json({
        msg:"This user is type client",
        success:false
    })
}
const putService = async (req,res)=>{
    //Si se modifica la localización se ha de mandar entera.
    const {id} = req.params;
    //Verificamos si el id pasado corresponde al negocio que el usuario es propietario.
    const service = await Service.findOne({id});
    if(service && service.idUser._id == req.uid){
        const {serviceName,idUser, ...rest} = req.body;
        await Service.findByIdAndUpdate(id,rest);

        //Obtain the service Updated.
        updateService = await Service.findOne({id});
        return res.json({
            success:true,
            updateService
        });
    }
    res.json({
        success:false,
        msg:"The user is not the director"
    });


}


const deleteService = (req,res)=>{}


module.exports ={
    getService,
    putService,
    deleteService,
    postService
}