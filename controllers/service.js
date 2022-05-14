

const Service = require("../models/services");
const User = require("../models/users");
const Work = require('../models/works');
const Post = require("../models/posts");
const deleteServiceElements = require("../helpers/deleteService");

const getService = async(req,res)=>{
    try {
        //hay que añadirle que devuelva los primeros comentarios y posts.
        const {id} = req.params;
        
        //Verify that the user request your service
        const service = await Service.findById(id);

        
        res.json({
                success:true,
                service
            });
        

        

    } catch (error) {
        res.status(500).json({success:false,msg:'Contact with the admin'});
    }
    
}

const getServicesUser = async(req,res)=>{
    try {
        

        
        const services = await Service.find({idUser: req.uid})

        
        res.json({
                success:true,
                services
            });
        

        

    } catch (error) {
        res.status(500).json({success:false,msg:'Contact with the admin'});
    }
    
}


const postService = async(req,res)=>{

    try {
        const{serviceCategory,serviceInfo,serviceName,
            cityName, street, postalCode} = req.body;
    
        //Obtain user object from idUser.
        const user = await User.findById(req.uid);
    
    
        //Verify if he or she is a business men
        if(user.type){
    
            const localization = {cityName,street,postalCode}
    
            //Create de Service instace
            const service = new Service({serviceCategory,serviceInfo,serviceName,localization,idUser:req.uid});
    
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
    } catch (error) {
        res.status(500).json({success:false,msg:'Contact with the admin'});
    }
    
}
const putService = async (req,res)=>{
    try {
        //Si se modifica la localización se ha de mandar entera.
        const {id} = req.params;
        //Verificamos si el id pasado corresponde al negocio que el usuario es propietario.
        const service = await Service.findById(id);

        
        if(service && service.idUser == req.uid){
            const {idUser, ...rest} = req.body;
            rest.localization = service.localization;
            if(rest.cityName)
                rest.localization.cityName = rest.cityName;
            if(rest.street)
                rest.localization.street = rest.street; 
            if(rest.postalCode)
                rest.localization.postalCode =rest.postalCode;

            const updatedService = await Service.findByIdAndUpdate(id,rest,{new:true});

            return res.json({
                success:true,
                service:updatedService
            });
        }
        res.json({
            success:false,
            msg:"The user is not the director"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,msg:'Contact with the admin'});
    }
}

const postFollowService = async (req,res) => {
    const {id} = req.params;
    try {
        const exits = await User.findOne({_id:req.uid,followServices : {$in: [id]}});

        if(!exits){
            await User.findByIdAndUpdate(req.uid,{
                $push: {followServices: id}
            });
            
            return res.json({
                success: true,
                followService:true
            });
        }
        
        await User.findByIdAndUpdate(req.uid,{
            $pull: {followServices: id}
        });

        return res.json({
            success: true,
            followService:false
        })
        
        
    
        
    } catch (error) {
        res.status(500).json({
            msg: error,
            success: false
        });
    }
    
}

const obtainCategoriesAvaliables = async(req,res) => {
    try {
        const services = await Service.find().select('serviceCategory -_id');
        //Objects Array to Array
        const categories = services.map((service)=>{return service.serviceCategory});
        //Filter duplicates elements
        const avaliablesCategories = [...new Set(categories)];
        //Return response
        res.json({success:true,categories:avaliablesCategories});

    } catch (error) {
        res.status(500).json({msg:'contact with admin',success:false});
    }
}

const validCategories = async(req, res) => {
    res.json({success:true, categories:['eletrónica','mecánica','auditoría-asesoría','aseguradoras',"peluquería",'dentistas','moda']})
}
const obtainServiceByCategory = async(req,res) =>{
    try {
        const {category} = req.body;
        const services = await Service.find({serviceCategory:category});
        res.json({success:true,services});
    } catch (error) {
        res.status(500).json({msg:'contact with admin',success:false});
    }
}

const obtainAllServices = async(req,res) =>{
    try {
        servicesList = await Service.find();
        res.json({success:true,services:servicesList});
        
    } catch (error) {
        console.log(error);
        res.status(500).json({msg:'contact with admin',success:false});

    }
}
const deleteService = async(req,res)=>{
    try {
        //Verify that the user is the bussinnes onwer.
        const service = await Service.findById(id);
        if(service.idUser != req.uid)
            return res.status(400).json({success:false,msg:`User does not have that business`});

        await deleteServiceElements(id);

    } catch (error) {
        res.status(500).json({msg:'contact with admin',success:false});
    }


}


module.exports ={
    getService,
    putService,
    deleteService,
    postService,
    postFollowService,
    obtainServiceByCategory,
    obtainCategoriesAvaliables,
    obtainAllServices,
    validCategories,
    getServicesUser
}