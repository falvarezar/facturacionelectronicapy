import { CommonRoutesConfig } from '../common/common.routes.config';
import deService from '../users/services/jsonDeMain.service';
import express from 'express';
import dsig from "../users/services/XMLDsig";

const params = {
    "version": 150,
    "fechaFirmaDigital": new Date(),
    "ruc": "80069563-1",
    "razonSocial": "DE generado en ambiente de prueba - sin valor comercial ni fiscal",
    "nombreFantasia": "TIPS S.A. TECNOLOGIA Y SERVICIOS",
    "actividadesEconomicas": [{
        "codigo": "1254",
        "descripcion": "Desarrollo de Software",
    }],
    "timbradoNumero": "12558946",
    "timbradoFecha": "2021-08-25T00:00:00",
    "tipoContribuyente": 2,
    "tipoRegimen": 8,
    "establecimientos": [{
        "codigo": "001",
        "direccion": "Barrio Carolina",
        "numeroCasa": "0",
        "complementoDireccion1": "Entre calle 2",
        "complementoDireccion2": "y Calle 7",
        "departamento": 11,
        "departamentoDescripcion": "ALTO PARANA",
        "distrito": 145,
        "distritoDescripcion": "CIUDAD DEL ESTE",
        "ciudad": 3432,
        "ciudadDescripcion": "PUERTO PTE.STROESSNER (MUNIC)",
        "telefono": "0973-527155",
        "email": "tips@tips.com.py",
        "denominacion": "Sucursal 1",
    }]
}
//ruta y pwd del certificado p12
let file = "D:\PROYECTOS\DIGSA\SET\facturacionelectronicapy\documenta.p12" 
let password = "12345"

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'UsersRoutes');
    }

    configureRoutes() {
        this.app.route(`/documentoset`)
            .post((req: express.Request, res: express.Response) => {
                // genera el xml con el metodo post de la api
                deService.generateXMLDE(params, req.body).then(xml => {
                    dsig.openFile(file, password); 
                    dsig.signDocument(xml, "DE").then(xml){
                        res.status(200).send(xml)
                    }
                });
            });

        this.app.route(`/users/:userId`)
            .all((req: express.Request, res: express.Response, next: express.NextFunction) => {
                // this middleware function runs before any request to /users/:userId
                // but it doesn't accomplish anything just yet---
                // it simply passes control to the next applicable function below using next()
                next();
            })
            .get((req: express.Request, res: express.Response) => {
                res.status(200).send(`GET requested for id ${req.params.userId}`);
            })
            .put((req: express.Request, res: express.Response) => {
                res.status(200).send(`PUT requested for id ${req.params.userId}`);
            })
            .patch((req: express.Request, res: express.Response) => {
                res.status(200).send(`PATCH requested for id ${req.params.userId}`);
            })
            .delete((req: express.Request, res: express.Response) => {
                res.status(200).send(`DELETE requested for id ${req.params.userId}`);
            });
        return this.app;
    }

}