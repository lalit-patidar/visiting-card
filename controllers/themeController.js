import TheamPackage from "../models/cardPackage";

export async function createPackage(req, res){

    try {
       const { packageName, amount } = req.body;
       
       let data = new TheamPackage({
           packageName: packageName,
           amount: amount
       });

       let result = await data.save();
       res.status(201).send({data: result})
    } catch( error ) {

        console.log(error);

        res.status(500).send({
            "message":"Internal server error",
            "status":500
        })
    }
}