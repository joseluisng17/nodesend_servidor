const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs');
const Enlaces = require('../models/Enlace');


exports.subirArchivo = async(req, res, next) => {

    const configuracionMulter = {
        // hacemos una comprobación de si el usuario esta autenticado puede subir un archivo de maximo 10 mega de otro modo solo 1 mega
        limits : { fileSize: req.usuario ? 1024 * 1024 *10 : 1000000 },
        storage: fileStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, __dirname+'/../uploads')
            },
            filename: (req, file, cb) => {
                // obtener la extensión del archivo
                const extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
                // otra forma de obtener la extensión es la siguiente, el problema de la siguiente forma es que si 
                // sube archivos donde en le nombre lleve puntos . se va perder la extensión ya que tomaria como 
                // extensión el nombre que encuentre enseguida del primer punto
                //const extension = file.mimetype.split('/')[1];
                cb(null, `${shortid.generate()}${extension}` );
            }
        })
    }

    const upload = multer(configuracionMulter).single('archivo');
    
    upload(req, res, async (error) => {
        console.log(req.file);

        if(!error){
            res.json({archivo: req.file.filename});
        }else{
            console.log(error);
            return next();
        }
    })

}

exports.eliminarArchivo = async(req, res) => {
    // console.log(req.file);

    try {
        fs.unlinkSync(__dirname + `/../uploads/${req.archivo}`);
        console.log('Archivo Eliminado');
    } catch (error) {
        console.log(error);
    }
    
}

// Descarga un archivo
exports.descargar = async(req, res, next) => {

    // Obtener el enlace
    const { archivo } = req.params;
    const enlace = await Enlaces.findOne({ nombre: archivo });

    console.log(enlace);

    const archivoDescarga = __dirname + '/../uploads/' + archivo;
    res.download(archivoDescarga);

    // Eliminar el archivo y la entrada en la base de datos

    const { descargas, nombre } = enlace;

    // Si las descargas son iguales a 1 borrar la entrada y borrar el archivo
    if( descargas === 1){
        // Eliminar el archivo
        req.archivo = nombre;

        // Eliminar la entrada de la bd
        await Enlaces.findOneAndRemove(enlace.id);
        
        // next lo utilizo para pasar al siguiente controlador, que en este caso sería al archivoController
        next()
    }else{
        // Si las descargas son > a 1 - Restar 1
        enlace.descargas--;
        await enlace.save();
    }

}