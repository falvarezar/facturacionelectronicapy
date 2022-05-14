import stringUtilService from './StringUtil.service';
import constanteService from './constante.service';
import jsonDteItemValidate from './jsonDteItemValidate.service';
import { XmlgenConfig } from './type.interface.';

class JSonDeMainValidateService {
  errors: Array<string>;

  constructor() {
    this.errors = new Array<string>();
  }
  /**
   * Valida los datos ingresados en el data
   * @param data
   */
  public validateValues(params: any, data: any, config: XmlgenConfig) {
    this.errors = new Array<string>();

    if (constanteService.tiposDocumentos.filter((um) => um.codigo === data['tipoDocumento']).length == 0) {
      this.errors.push("Tipo de Documento '" + data['tipoDocumento']) +
        "' en data.tipoDocumento no válido. Valores: " +
        constanteService.tiposDocumentos.map((a) => a.codigo + '-' + a.descripcion);
    }

    if (typeof data['cliente'] == 'undefined') {
      this.errors.push('Debe especificar los datos del Cliente en data.cliente');
    }

    if (data['cliente']) {
      if (typeof data['cliente']['contribuyente'] == 'undefined') {
        this.errors.push(
          'Debe indicar si el Cliente es o no un Contribuyente true|false en data.cliente.contribuyente',
        );
      }

      if (typeof data['cliente']['contribuyente'] == 'undefined') {
        this.errors.push(
          'Debe indicar si el Cliente es o no un Contribuyente true|false en data.cliente.contribuyente',
        );
      }

      if (!(data['cliente']['contribuyente'] === true || data['cliente']['contribuyente'] === false)) {
        this.errors.push('data.cliente.contribuyente debe ser true|false');
      }
    }

    this.generateCodigoControlValidate(params, data);

    this.generateDeValidate(params, data);

    this.generateDatosOperacionValidate(params, data);

    this.generateDatosGeneralesValidate(params, data);

    this.generateDatosEspecificosPorTipoDEValidate(params, data);

    if (data['tipoDocumento'] == 1 || data['tipoDocumento'] == 4) {
      this.generateDatosCondicionOperacionDEValidate(params, data);
    }

    this.errors = jsonDteItemValidate.generateDatosItemsOperacionValidate(params, data, this.errors);

    this.generateDatosComplementariosComercialesDeUsoEspecificosValidate(params, data);

    if (data['tipoDocumento'] == 1 || data['tipoDocumento'] == 7) {
      //1 Opcional, 7 Obligatorio
      if (data['detalleTransporte']) {
        this.generateDatosTransporteValidate(params, data);
      }
    }

    if (data['tipoDocumento'] != 7) {
      this.generateDatosTotalesValidate(params, data);
    }

    if (data['complementarios']) {
      this.generateDatosComercialesUsoGeneralValidate(params, data);
    }

    if (data['moneda'] != 'PYG' && data['condicionTipoCambio'] == 1) {
      if (!data['cambio']) {
        this.errors.push(
          'Debe especificar el valor del Cambio en data.cambio cuando moneda != PYG y la Cotización es Global',
        );
      }
    }

    if (data['tipoDocumento'] == 4 || data['tipoDocumento'] == 5 || data['tipoDocumento'] == 6) {
      if (!data['documentoAsociado']) {
        this.errors.push(
          'Documento asociado es obligatorio para el tipo de documento electrónico (' +
            data['tipoDocumento'] +
            ') seleccionado',
        );
      }
    }
    if (
      data['tipoDocumento'] == 1 ||
      data['tipoDocumento'] == 4 ||
      data['tipoDocumento'] == 5 ||
      data['tipoDocumento'] == 6 ||
      data['tipoDocumento'] == 7
    ) {
      if (data['documentoAsociado']) {
        this.generateDatosDocumentoAsociadoValidate(params, data);
      }
    }

    //Tratamiento Final, del Envio del Error, no tocar
    if (this.errors.length > 0) {
      let errorExit: any = new Error();

      let msgErrorExit = '';

      let recorrerHasta = this.errors.length;
      if ((config.errorLimit || 3) < recorrerHasta) {
        recorrerHasta = config.errorLimit || 3;
      }

      for (let i = 0; i < recorrerHasta; i++) {
        const error = this.errors[i];
        msgErrorExit += error;

        if (i < recorrerHasta - 1) {
          msgErrorExit += config.errorSeparator + '';
        }
      }

      errorExit.message = msgErrorExit;
      /*errorExit.firstMessage = this.errors[0];
      errorExit.errorsArray = this.errors;*/
      throw errorExit;
    }
  }

  generateCodigoControlValidate(params: any, data: any) {
    if (data.cdc && (data.cdc + '').length == 44) {
      //Caso ya se le pase el CDC
      //const codigoSeguridad = data.cdc.substring(34, 43);
      const codigoControl = data.cdc;

      //Como se va utilizar el CDC enviado como parametro, va a verificar que todos los datos del XML coincidan con el CDC.
      const tipoDocumentoCDC = codigoControl.substring(0, 2);
      //const rucCDC = this.codigoControl.substring(2, 10);
      //const dvCDC = this.codigoControl.substring(10, 11);
      const establecimientoCDC = codigoControl.substring(11, 14);
      const puntoCDC = codigoControl.substring(14, 17);
      const numeroCDC = codigoControl.substring(17, 24);
      //const tipoContribuyenteCDC = this.codigoControl.substring(24, 25);
      const fechaCDC = codigoControl.substring(25, 33);
      const tipoEmisionCDC = codigoControl.substring(33, 34);

      if (+data['tipoDocumento'] != +tipoDocumentoCDC) {
        this.errors.push(
          "El Tipo de Documento '" +
            data['tipoDocumento'] +
            "' en data.tipoDocumento debe coincidir con el CDC re-utilizado (" +
            +tipoDocumentoCDC +
            ')',
        );
      }

      const establecimiento = stringUtilService.leftZero(data['establecimiento'], 3);
      if (establecimiento != establecimientoCDC) {
        this.errors.push(
          "El Establecimiento '" +
            establecimiento +
            "'en data.establecimiento debe coincidir con el CDC reutilizado (" +
            establecimientoCDC +
            ')',
        );
      }

      const punto = stringUtilService.leftZero(data['punto'], 3);
      if (punto != puntoCDC) {
        this.errors.push(
          "El Punto '" + punto + "' en data.punto debe coincidir con el CDC reutilizado (" + puntoCDC + ')',
        );
      }

      const numero = stringUtilService.leftZero(data['numero'], 7);
      if (numero != numeroCDC) {
        this.errors.push(
          "El Numero de Documento '" +
            numero +
            "'en data.numero debe coincidir con el CDC reutilizado (" +
            numeroCDC +
            ')',
        );
      }

      /*if (+data['tipoContribuyente'] != +tipoContribuyenteCDC) {
        this.errors.push("El Tipo de Contribuyente '" + data['tipoContribuyente'] + "' en data.tipoContribuyente debe coincidir con el CDC reutilizado (" + tipoContribuyenteCDC + ")");
      }*/
      const fecha =
        (data['fecha'] + '').substring(0, 4) +
        (data['fecha'] + '').substring(5, 7) +
        (data['fecha'] + '').substring(8, 10);
      if (fecha != fechaCDC) {
        this.errors.push(
          "La fecha '" + fecha + "' en data.fecha debe coincidir con el CDC reutilizado (" + fechaCDC + ')',
        );
      }

      if (+data['tipoEmision'] != +tipoEmisionCDC) {
        this.errors.push(
          "El Tipo de Emisión '" +
            data['tipoEmision'] +
            "' en data.tipoEmision debe coincidir con el CDC reutilizado (" +
            tipoEmisionCDC +
            ')',
        );
      }
    }
  }

  private generateDeValidate(params: any, data: any) {
    if (params['ruc'].indexOf('-') == -1) {
      this.errors.push('RUC debe contener dígito verificador en params.ruc');
    }
    const rucEmisor = params['ruc'].split('-')[0];
    const dvEmisor = params['ruc'].split('-')[1];

    var reg = new RegExp(/^\d+$/);
    if (!reg.test(rucEmisor)) {
      this.errors.push("El RUC '" + rucEmisor + "' debe ser numérico");
    }
    if (!reg.test(dvEmisor)) {
      this.errors.push("El DV del RUC '" + dvEmisor + "' debe ser numérico");
    }
  }

  private generateDatosOperacionValidate(params: any, data: any) {
    if (params['ruc'].indexOf('-') == -1) {
      this.errors.push('RUC debe contener dígito verificador en params.ruc');
    }

    if (constanteService.tiposEmisiones.filter((um) => um.codigo === data['tipoEmision']).length == 0) {
      this.errors.push(
        "Tipo de Emisión '" +
          data['tipoEmision'] +
          "' en data.tipoEmision no válido. Valores: " +
          constanteService.tiposEmisiones.map((a) => a.codigo + '-' + a.descripcion),
      );
    }

    //Validar aqui "dInfoFisc"
    if (data['tipoDocumento'] == 7) {
      //Nota de Remision
      if (!(data['descripcion'] && data['descripcion'].length > 0)) {
        this.errors.push('Debe informar la Descripción en data.descripcion para el Documento Electrónico');
      }
    }
  }

  private generateDatosGeneralesValidate(params: any, data: any, defaultValues?: boolean) {
    this.generateDatosGeneralesInherentesOperacionValidate(params, data, defaultValues);
    this.generateDatosGeneralesEmisorDEValidate(params, data);
    if (data['usuario']) {
      //No es obligatorio
      this.generateDatosGeneralesResponsableGeneracionDEValidate(params, data);
    }
    this.generateDatosGeneralesReceptorDEValidate(params, data);
  }

  private generateDatosGeneralesInherentesOperacionValidate(params: any, data: any, defaultValues?: boolean) {
    if (data['tipoDocumento'] == 7) {
      //C002
      return; //No informa si el tipo de documento es 7
    }

    if (!data['tipoImpuesto']) {
      this.errors.push('Debe especificar el Tipo de Impuesto en data.tipoImpuesto');
    } else {
      if (constanteService.tiposImpuestos.filter((um) => um.codigo === data['tipoImpuesto']).length == 0) {
        this.errors.push(
          "Tipo de Impuesto '" +
            data['tipoImpuesto'] +
            "' en data.tipoImpuesto no válido. Valores: " +
            constanteService.tiposImpuestos.map((a) => a.codigo + '-' + a.descripcion),
        );
      }
    }

    let moneda = data['moneda'];
    if (!moneda && defaultValues === true) {
      moneda = 'PYG';
    }

    if (constanteService.monedas.filter((um) => um.codigo === moneda).length == 0) {
      this.errors.push(
        "Moneda '" +
          moneda +
          "' en data.moneda no válido. Valores: " +
          constanteService.monedas.map((a) => a.codigo + '-' + a.descripcion),
      );
    }

    if (data['condicionAnticipo']) {
      if (constanteService.globalPorItem.filter((um) => um.codigo === data['condicionAnticipo']).length == 0) {
        this.errors.push(
          "Condición de Anticipo '" +
            data['condicionAnticipo'] +
            "' en data.condicionAnticipo no válido. Valores: " +
            constanteService.globalPorItem.map((a) => a.codigo + '-Anticipo ' + a.descripcion),
        );
      }
    }

    if (constanteService.tiposTransacciones.filter((um) => um.codigo === data['tipoTransaccion']).length == 0) {
      this.errors.push(
        "Tipo de Transacción '" +
          data['tipoTransaccion'] +
          "' en data.tipoTransaccion no válido. Valores: " +
          constanteService.tiposTransacciones.map((a) => a.codigo + '-' + a.descripcion),
      );
    }

    if (data['tipoDocumento'] == 1 || data['tipoDocumento'] == 4) {
      //Obligatorio informar iTipTra D011
      if (!data['tipoTransaccion']) {
        this.errors.push('Debe proveer el Tipo de Transacción en data.tipoTransaccion');
      }
    }

    if (moneda != 'PYG') {
      if (!data['condicionTipoCambio']) {
        this.errors.push('Debe informar el tipo de Cambio en data.condicionTipoCambio');
      }
    }

    if (data['condicionTipoCambio'] == 1 && moneda != 'PYG') {
      if (!(data['cambio'] && data['cambio'] > 0)) {
        this.errors.push('Debe informar el valor del Cambio en data.cambio');
      }
    }
  }

  private generateDatosGeneralesEmisorDEValidate(params: any, data: any) {
    if (!(params && params.establecimientos)) {
      this.errors.push('Debe proveer un Array con la información de los establecimientos en params');
    }

    //Validar si el establecimiento viene en params
    let establecimiento = stringUtilService.leftZero(data['establecimiento'], 3);
    //let punto = stringUtilService.leftZero(data['punto'], 3);

    if (params.establecimientos.filter((um: any) => um.codigo === establecimiento).length == 0) {
      this.errors.push(
        "Establecimiento '" +
          establecimiento +
          "' no encontrado en params.establecimientos*.codigo. Valores: " +
          params.establecimientos.map((a: any) => a.codigo + '-' + a.denominacion),
      );
    }

    if (params['ruc'].indexOf('-') == -1) {
      this.errors.push('RUC debe contener dígito verificador en params.ruc');
    }

    if (!(params['actividadesEconomicas'] && params['actividadesEconomicas'].length > 0)) {
      this.errors.push('Debe proveer el array de actividades económicas en params.actividadesEconomicas');
    }
  }

  private generateDatosGeneralesResponsableGeneracionDEValidate(params: any, data: any) {
    if (
      constanteService.tiposDocumentosIdentidades.filter((um: any) => um.codigo === data['usuario']['documentoTipo'])
        .length == 0
    ) {
      this.errors.push(
        "Tipo de Documento '" +
          data['usuario']['documentoTipo'] +
          "' no encontrado en data.usuario.documentoTipo. Valores: " +
          constanteService.tiposDocumentosIdentidades.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    if (!data['usuario']['documentoNumero']) {
      this.errors.push('El Documento del Responsable en data.usuario.documentoNumero no puede ser vacio');
    }

    if (!data['usuario']['nombre']) {
      this.errors.push('El Nombre del Responsable en data.usuario.nombre no puede ser vacio');
    }

    if (!data['usuario']['cargo']) {
      this.errors.push('El Cargo del Responsable en data.usuario.cargo no puede ser vacio');
    }
  }

  private generateDatosGeneralesReceptorDEValidate(params: any, data: any) {
    if (!data['cliente']) {
      return; //El error de cliente vacio, ya fue validado arriba
    }

    if (!data['cliente']['contribuyente'] && data['cliente']['tipoOperacion'] != 4) {
      if (
        constanteService.tiposDocumentosReceptor.filter((um: any) => um.codigo === data['cliente']['documentoTipo'])
          .length == 0
      ) {
        this.errors.push(
          "Tipo de Documento '" +
            data['cliente']['documentoTipo'] +
            "' del Cliente en data.cliente.documentoTipo no encontrado. Valores: " +
            constanteService.tiposDocumentosReceptor.map((a: any) => a.codigo + '-' + a.descripcion),
        );
      }
    }

    var regExpOnlyNumber = new RegExp(/^\d+$/);
    if (data['cliente']['contribuyente']) {
      if (!data['cliente']['ruc']) {
        this.errors.push('Debe proporcionar el RUC en data.cliente.ruc');
      }
      if (data['cliente']['ruc'].indexOf('-') == -1) {
        this.errors.push('RUC debe contener dígito verificador en data.cliente.ruc');
      }

      const rucCliente = data['cliente']['ruc'].split('-');

      if (!regExpOnlyNumber.test((rucCliente[0] + '').trim())) {
        this.errors.push("El RUC del Cliente '" + rucCliente[0] + "' en data.cliente.ruc debe ser numérico");
      }
      if (!regExpOnlyNumber.test((rucCliente[1] + '').trim())) {
        this.errors.push("El DV del RUC del Cliente '" + rucCliente[1] + "' en data.cliente.ruc debe ser numérico");
      }
    }

    if (constanteService.paises.filter((pais: any) => pais.codigo === data['cliente']['pais']).length == 0) {
      this.errors.push(
        "Pais '" +
          data['cliente']['pais'] +
          "' del Cliente en data.cliente.pais no encontrado. Valores: " +
          constanteService.paises.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    if (data['tipoDocumento'] == 4) {
      if (data['cliente']['tipoOperacion'] != 2) {
        this.errors.push('El Tipo de Operación debe ser 2-B2C para el Tipo de Documento AutoFactura');
      }
    }

    if (!data['cliente']['contribuyente'] && data['cliente']['tipoOperacion']) {
      //Obligatorio completar D210

      if (data['cliente']['tipoOperacion'] != 4 && !data['cliente']['documentoNumero']) {
        this.errors.push('Debe informar el número de documento en data.cliente.documentoNumero');
      }

      if (!data['cliente']['contribuyente'] && data['cliente']['tipoOperacion'] != 4) {
        if (!data['cliente']['documentoTipo']) {
          this.errors.push('Debe informar el Tipo de Documento del Cliente en data.cliente.documentoTipo');
        }
      }
    }

    if (data['tipoDocumento'] === 7 || data['cliente']['tipoOperacion'] === 4) {
      if (!data['cliente']['direccion']) {
        this.errors.push('data.cliente.direccion es Obligatorio para Tipo de Documento 7 o Tipo de Operación 4');
      }
    }

    if (data['cliente']['direccion']) {
      //Si tiene dirección hay que completar numero de casa.
      if (!data['cliente']['numeroCasa']) {
        this.errors.push('Debe informar el Número de casa del Receptor en data.cliente.numeroCasa');
      }
    }

    if (data['cliente']['numeroCasa']) {
      if (!regExpOnlyNumber.test(data['cliente']['numeroCasa'])) {
        this.errors.push('El Número de Casa en data.cliente.numeroCasa debe ser numérico');
      }
    }

    if (data['cliente']['direccion'] && data['cliente']['tipoOperacion'] != 4) {
      if (!data['cliente']['departamento']) {
        this.errors.push(
          'Obligatorio especificar el Departamento en data.cliente.departamento para Tipo de Documento != 4',
        );
      }
      if (
        constanteService.departamentos.filter(
          (departamento: any) => departamento.codigo === +data['cliente']['departamento'],
        ).length == 0
      ) {
        this.errors.push(
          "Departamento '" +
            data['cliente']['departamento'] +
            "' del Cliente en data.cliente.departamento no encontrado. Valores: " +
            constanteService.departamentos.map((a: any) => a.codigo + '-' + a.descripcion),
        );
      }
    }

    if (data['cliente']['direccion'] && data['cliente']['tipoOperacion'] != 4) {
      if (!data['cliente']['distrito']) {
        this.errors.push('Obligatorio especificar el Distrito en data.cliente.distrito para Tipo de Documento != 4');
      }

      if (
        constanteService.distritos.filter((distrito: any) => distrito.codigo === +data['cliente']['distrito']).length ==
        0
      ) {
        this.errors.push(
          "Distrito '" +
            data['cliente']['distrito'] +
            "' del Cliente en data.cliente.distrito no encontrado. Valores: " +
            constanteService.distritos.map((a: any) => a.codigo + '-' + a.descripcion),
        );
      }
    }

    if (data['cliente']['direccion'] && data['cliente']['tipoOperacion'] != 4) {
      if (!data['cliente']['ciudad']) {
        this.errors.push('Obligatorio especificar la Ciudad en data.cliente.ciudad para Tipo de Documento != 4');
      }
      if (constanteService.ciudades.filter((ciudad: any) => ciudad.codigo === +data['cliente']['ciudad']).length == 0) {
        this.errors.push(
          "Ciudad '" +
            data['cliente']['ciudad'] +
            "' del Cliente en data.cliente.ciudad no encontrado. Valores: " +
            constanteService.ciudades.map((a: any) => a.codigo + '-' + a.descripcion),
        );
      }
    }

    constanteService.validateDepartamentoDistritoCiudad(
      'data.cliente',
      +data['cliente']['departamento'],
      +data['cliente']['distrito'],
      +data['cliente']['ciudad'],
      this.errors,
    );

    if (data['cliente']['telefono']) {
      if (!(data['cliente']['telefono'].length >= 6 && data['cliente']['telefono'].length <= 15)) {
        this.errors.push(
          "El valor '" +
            data['cliente']['telefono'] +
            "' en data.cliente.telefono debe tener una longitud de 6 a 15 caracteres",
        );
      }
    }

    if (data['cliente']['celular']) {
      if (!(data['cliente']['celular'].length >= 10 && data['cliente']['celular'].length <= 20)) {
        this.errors.push(
          "El valor '" +
            data['cliente']['celular'] +
            "' en data.cliente.celular debe tener una longitud de 10 a 20 caracteres",
        );
      }
    }

    if (data['cliente']['email']) {
      let email = new String(data['cliente']['email']); //Hace una copia, para no alterar.

      //Verificar si tiene varios correos.
      if (email.indexOf(',') > -1) {
        //Si el Email tiene , (coma) entonces va enviar solo el primer valor, ya que la SET no acepta Comas
        email = email.split(',')[0].trim();
      }

      //Verificar espacios
      if (email.indexOf(' ') > -1) {
        this.errors.push("El valor '" + email + "' en data.cliente.email no puede poseer espacios");
      }

      if (!(email.length >= 3 && email.length <= 80)) {
        this.errors.push("El valor '" + email + "' en data.cliente.email debe tener una longitud de 3 a 80 caracteres");
      }
    }

    if (data['cliente']['codigo']) {
      if (!((data['cliente']['codigo'] + '').length >= 3)) {
        this.errors.push(
          "El código del Cliente '" +
            data['cliente']['codigo'] +
            "' en data.cliente.codigo debe tener al menos 3 caracteres",
        );
      }
    }
  }

  private generateDatosEspecificosPorTipoDEValidate(params: any, data: any) {
    if (data['tipoDocumento'] === 1) {
      this.generateDatosEspecificosPorTipoDE_FacturaElectronicaValidate(params, data);
    }
    if (data['tipoDocumento'] === 4) {
      this.generateDatosEspecificosPorTipoDE_AutofacturaValidate(params, data);
    }

    if (data['tipoDocumento'] === 5 || data['tipoDocumento'] === 6) {
      this.generateDatosEspecificosPorTipoDE_NotaCreditoDebitoValidate(params, data);
    }

    if (data['tipoDocumento'] === 7) {
      this.generateDatosEspecificosPorTipoDE_RemisionElectronicaValidate(params, data);
    }
  }

  private generateDatosEspecificosPorTipoDE_FacturaElectronicaValidate(params: any, data: any) {
    if (!data['factura']) {
      this.errors.push('Debe indicar los datos especificos de la Factura en data.factura');
      return; // Termina el metodos
    }

    if (
      constanteService.indicadoresPresencias.filter((um: any) => um.codigo === data['factura']['presencia']).length == 0
    ) {
      this.errors.push(
        "Indicador de Presencia '" +
          data['factura']['presencia'] +
          "' en data.factura.presencia no encontrado. Valores: " +
          constanteService.indicadoresPresencias.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    if (data['factura']['fechaEnvio']) {
      let fechaFactura = new Date(data['fecha']);
      let fechaEnvio = new Date(data['factura']['fechaEnvio']);

      if (fechaFactura.getTime() > fechaEnvio.getTime()) {
        this.errors.push(
          "La Fecha de envío '" +
            data['factura']['fechaEnvio'] +
            "'en data.factura.fechaEnvio, debe ser despues de la fecha de Factura",
        );
      }
    }

    if (data['cliente']['tipoOperacion'] === 3) {
      this.generateDatosEspecificosPorTipoDE_ComprasPublicasValidate(params, data);
    }
  }

  /**
   * Datos especificos cuando el tipo de operacion del receptor es B2G (Campo D202)
   * Dentro de la factura electronica
   *
   * @param params
   * @param data
   * @param options
   */
  private generateDatosEspecificosPorTipoDE_ComprasPublicasValidate(params: any, data: any) {
    if (!(data['dncp'] && data['dncp']['modalidad'] && data['dncp']['modalidad'].length > 0)) {
      this.errors.push('Debe informar la modalidad de Contratación DNCP en data.dncp.modalidad');
    }
    if (!(data['dncp'] && data['dncp']['entidad'] && data['dncp']['entidad'].length > 0)) {
      this.errors.push('Debe informar la entidad de Contratación DNCP en data.dncp.entidad');
    }
    if (!(data['dncp'] && data['dncp']['año'] && data['dncp']['año'].length > 0)) {
      this.errors.push('Debe informar la año de Contratación DNCP en data.dncp.año');
    }
    if (!(data['dncp'] && data['dncp']['secuencia'] && data['dncp']['secuencia'].length > 0)) {
      this.errors.push('Debe informar la secuencia de Contratación DNCP en data.dncp.secuencia');
    }
    if (!(data['dncp'] && data['dncp']['fecha'] && data['dncp']['fecha'].length > 0)) {
      this.errors.push('Debe informar la fecha de emisión de código de Contratación DNCP en data.dncp.fecha');
    }
  }

  private generateDatosEspecificosPorTipoDE_AutofacturaValidate(params: any, data: any) {
    if (!data['autoFactura']) {
      this.errors.push('Para tipoDocumento = 4 debe proveer los datos de Autofactura en data.autoFactura');
    }
    if (!data['autoFactura']['ubicacion']) {
      this.errors.push(
        'Para tipoDocumento = 4 debe proveer los datos del Lugar de Transacción de la Autofactura en data.autoFactura.ubicacion',
      );
    }

    if (!data['autoFactura']['tipoVendedor']) {
      this.errors.push('Debe especificar la Naturaleza del Vendedor en data.autoFactura.tipoVendedor');
    }

    if (!data['autoFactura']['documentoTipo']) {
      this.errors.push('Debe especificar el Tipo de Documento del Vendedor en data.autoFactura.documentoTipo');
    }

    if (
      constanteService.naturalezaVendedorAutofactura.filter(
        (um: any) => um.codigo === data['autoFactura']['tipoVendedor'],
      ).length == 0
    ) {
      this.errors.push(
        "Tipo de Vendedor '" +
          data['autoFactura']['tipoVendedor'] +
          "' en data.autoFactura.tipoVendedor no encontrado. Valores: " +
          constanteService.naturalezaVendedorAutofactura.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    if (
      constanteService.tiposDocumentosIdentidades.filter(
        (um: any) => um.codigo === data['autoFactura']['documentoTipo'],
      ).length == 0
    ) {
      this.errors.push(
        "Tipo de Documento '" +
          data['autoFactura']['documentoTipo'] +
          "' en data.autoFactura.documentoTipo no encontrado. Valores: " +
          constanteService.tiposDocumentosIdentidades.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    if (!data['autoFactura']['ubicacion']) {
      this.errors.push('Debe especificar la ubicación de la transacción en data.autoFactura.ubicacion');
    }

    if (!data['autoFactura']['documentoNumero']) {
      this.errors.push('Debe especificar el Nro. de Documento del Vendedor en data.autoFactura.documentoNumero');
    }
    if (!data['autoFactura']['nombre']) {
      this.errors.push('Debe especificar el Nombre del Vendedor en data.autoFactura.nombre');
    }
    if (!data['autoFactura']['direccion']) {
      this.errors.push('Debe especificar la Dirección del Vendedor en data.autoFactura.direccion');
    }
    if (!data['autoFactura']['numeroCasa']) {
      this.errors.push('Debe especificar el Número de Casa del Vendedor en data.autoFactura.numeroCasa');
    }

    if (!data['autoFactura']['departamento']) {
      this.errors.push('Debe especificar el Departamento del Vendedor en data.autoFactura.departamento');
    }
    if (!data['autoFactura']['distrito']) {
      this.errors.push('Debe especificar el Distrito Vendedor en data.autoFactura.distrito');
    }
    if (!data['autoFactura']['ciudad']) {
      this.errors.push('Debe especificar la Ciudad del Vendedor en data.autoFactura.ciudad');
    }

    if (!data['autoFactura']['ubicacion']['departamento']) {
      this.errors.push(
        'Debe especificar el Departamento del Lugar de la Transacción en data.autoFactura.ubicacion.departamento',
      );
    }
    if (!data['autoFactura']['ubicacion']['distrito']) {
      this.errors.push(
        'Debe especificar el Distrito del Lugar de la Transacciónen data.autoFactura.ubicacion.distrito',
      );
    }
    if (!data['autoFactura']['ubicacion']['ciudad']) {
      this.errors.push('Debe especificar la Ciudad del Lugar de la Transacción en data.autoFactura.ubicacion.ciudad');
    }

    constanteService.validateDepartamentoDistritoCiudad(
      'data.autoFactura',
      +data['autoFactura']['departamento'],
      +data['autoFactura']['distrito'],
      +data['autoFactura']['ciudad'],
      this.errors,
    );

    constanteService.validateDepartamentoDistritoCiudad(
      'data.autoFactura.ubicacion',
      +data['autoFactura']['ubicacion']['departamento'],
      +data['autoFactura']['ubicacion']['distrito'],
      +data['autoFactura']['ubicacion']['ciudad'],
      this.errors,
    );
  }

  private generateDatosEspecificosPorTipoDE_NotaCreditoDebitoValidate(params: any, data: any) {
    if (!data['notaCreditoDebito']['motivo']) {
      this.errors.push('Debe completar el motivo para la nota de crédito/débito en data.notaCreditoDebito.motivo');
    }

    if (
      constanteService.notasCreditosMotivos.filter((um: any) => um.codigo === data['notaCreditoDebito']['motivo'])
        .length == 0
    ) {
      this.errors.push(
        "Motivo de la Nota de Crédito/Débito '" +
          data['notaCreditoDebito']['motivo'] +
          "' en data.notaCreditoDebito.motivo no encontrado. Valores: " +
          constanteService.notasCreditosMotivos.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }
  }

  private generateDatosEspecificosPorTipoDE_RemisionElectronicaValidate(params: any, data: any) {
    if (!(data['remision'] && data['remision']['motivo'])) {
      this.errors.push('No fue pasado el Motivo de la Remisión en data.remision.motivo.');
    }

    if (!(data['remision'] && data['remision']['tipoResponsable'])) {
      this.errors.push('No fue pasado el Tipo de Responsable de la Remisión en data.remision.tipoResponsable.');
    }

    if (constanteService.remisionesMotivos.filter((um: any) => um.codigo === data['remision']['motivo']).length == 0) {
      this.errors.push(
        "Motivo de la Remisión '" +
          data['remision']['motivo'] +
          "' en data.remision.motivo no encontrado. Valores: " +
          constanteService.remisionesMotivos.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    if (data['remision'] && data['remision']['motivo'] == 7) {
      if (data['cliente']['ruc'] != params['ruc']) {
        this.errors.push('RUC del receptor no coincidente con el RUC del emisor');
      }
    }

    if (
      constanteService.remisionesResponsables.filter((um: any) => um.codigo === data['remision']['tipoResponsable'])
        .length == 0
    ) {
      this.errors.push(
        "Tipo de Responsable '" +
          data['remision']['tipoResponsable'] +
          "' en data.remision.tipoResponsable no encontrado. Valores: " +
          constanteService.remisionesResponsables.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }
  }

  private generateDatosCondicionOperacionDEValidate(params: any, data: any) {
    if (!data['condicion']) {
      this.errors.push('Debe indicar los datos de la Condición de la Operación en data.condicion');
      return; // sale metodo
    }

    if (
      constanteService.condicionesOperaciones.filter((um: any) => um.codigo === data['condicion']['tipo']).length == 0
    ) {
      this.errors.push(
        "Condición de la Operación '" +
          data['condicion']['tipo'] +
          "' en data.condicion.tipo no encontrado. Valores: " +
          constanteService.condicionesOperaciones.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    //if (data['condicion']['tipo'] === 1) {
    this.generateDatosCondicionOperacionDE_ContadoValidate(params, data);
    //}

    if (data['condicion']['tipo'] === 2) {
      this.generateDatosCondicionOperacionDE_CreditoValidate(params, data);
    }
  }

  /**
   * E7.1. Campos que describen la forma de pago de la operación al contado o del monto
   * de la entrega inicial (E605-E619)
   * @param params
   * @param data
   * @param options
   */
  private generateDatosCondicionOperacionDE_ContadoValidate(params: any, data: any) {
    if (data['condicion']['tipo'] === 1) {
      if (!(data['condicion']['entregas'] && data['condicion']['entregas'].length > 0)) {
        this.errors.push(
          'El Tipo de Condición es 1 en data.condicion.tipo pero no se encontraron entregas en data.condicion.entregas',
        );
      }
    }

    if (data['condicion']['entregas'] && data['condicion']['entregas'].length > 0) {
      for (let i = 0; i < data['condicion']['entregas'].length; i++) {
        const dataEntrega = data['condicion']['entregas'][i];

        if (constanteService.condicionesTiposPagos.filter((um: any) => um.codigo === dataEntrega['tipo']).length == 0) {
          this.errors.push(
            "Condición de Tipo de Pago '" +
              dataEntrega['tipo'] +
              "' en data.condicion.entregas[" +
              i +
              '].tipo no encontrado. Valores: ' +
              constanteService.condicionesTiposPagos.map((a: any) => a.codigo + '-' + a.descripcion),
          );
        }

        if (!dataEntrega['moneda']) {
          this.errors.push('Moneda es obligatorio en data.condicion.entregas[' + i + '].moneda');
        }

        if (constanteService.monedas.filter((um) => um.codigo === dataEntrega['moneda']).length == 0) {
          this.errors.push("Moneda '" + dataEntrega['moneda']) +
            "' data.condicion.entregas[" +
            i +
            '].moneda no válido. Valores: ' +
            constanteService.monedas.map((a) => a.codigo + '-' + a.descripcion);
        }

        //Verificar si el Pago es con Tarjeta de crédito
        if (dataEntrega['tipo'] === 3 || dataEntrega['tipo'] === 4) {
          if (!dataEntrega['infoTarjeta']) {
            this.errors.push(
              'Debe informar sobre la tarjeta en data.condicion.entregas[' +
                i +
                '].infoTarjeta si la forma de Pago es a Tarjeta',
            );
          }

          if (
            constanteService.condicionesOperaciones.filter(
              (um: any) => um.codigo === dataEntrega['infoTarjeta']['tipo'],
            ).length == 0
          ) {
            this.errors.push(
              "Tipo de Tarjeta de Crédito '" +
                dataEntrega['infoTarjeta']['tipo'] +
                "' en data.condicion.entregas[" +
                i +
                '].infoTarjeta.tipo no encontrado. Valores: ' +
                constanteService.condicionesOperaciones.map((a: any) => a.codigo + '-' + a.descripcion),
            );
          }

          if (dataEntrega['infoTarjeta']['ruc'].indexOf('-') == -1) {
            this.errors.push(
              'Ruc de Proveedor de Tarjeta debe contener digito verificador en data.condicion.entregas[' +
                i +
                '].infoTarjeta.ruc',
            );
          }

          if (dataEntrega['infoTarjeta']['codigoAutorizacion']) {
            if (
              !(
                (dataEntrega['infoTarjeta']['codigoAutorizacion'] + '').length >= 6 &&
                (dataEntrega['infoTarjeta']['codigoAutorizacion'] + '').length <= 10
              )
            ) {
              this.errors.push(
                'El código de Autorización en data.condicion.entregas[' +
                  i +
                  '].infoTarjeta.codigoAutorizacion debe tener de 6 y 10 caracteres',
              );
            }
          }

          if (dataEntrega['infoTarjeta']['numero']) {
            if (!((dataEntrega['infoTarjeta']['numero'] + '').length == 4)) {
              this.errors.push(
                'El código de Autorización en data.condicion.entregas[' +
                  i +
                  '].infoTarjeta.numero debe tener de 4 caracteres',
              );
            }
          }
        }

        //Verificar si el Pago es con Cheque
        if (dataEntrega['tipo'] === 2) {
          if (!dataEntrega['infoCheque']) {
            this.errors.push(
              'Debe informar sobre el cheque en data.condicion.entregas[' +
                i +
                '].infoCheque si la forma de Pago es 2-Cheques',
            );
          }
        }
      }
    }
  }

  /**
   * E7.2. Campos que describen la operación a crédito (E640-E649)
   *
   * @param params
   * @param data
   * @param options
   */
  private generateDatosCondicionOperacionDE_CreditoValidate(params: any, data: any) {
    if (!data['condicion']['credito']['tipo']) {
      this.errors.push(
        'El tipo de Crédito en data.condicion.credito.tipo es obligatorio si la condición posee créditos',
      );
    }

    if (
      constanteService.condicionesCreditosTipos.filter((um: any) => um.codigo === data['condicion']['credito']['tipo'])
        .length == 0
    ) {
      this.errors.push(
        "Tipo de Crédito '" +
          data['condicion']['credito']['tipo'] +
          "' en data.condicion.credito.tipo no encontrado. Valores: " +
          constanteService.condicionesCreditosTipos.map((a: any) => a.codigo + '-' + a.descripcion),
      );
    }

    if (+data['condicion']['credito']['tipo'] === 1) {
      //Plazo
      if (!data['condicion']['credito']['plazo']) {
        this.errors.push(
          'El tipo de Crédito en data.condicion.credito.tipo es 1 entonces data.condicion.credito.plazo es obligatorio',
        );
      }
    }

    if (+data['condicion']['credito']['tipo'] === 2) {
      //Cuota
      if (!data['condicion']['credito']['cuotas']) {
        this.errors.push(
          'El tipo de Crédito en data.condicion.credito.tipo es 2 entonces data.condicion.credito.cuotas es obligatorio',
        );
      }
    }

    //Recorrer array de infoCuotas e informar en el JSON
    if (data['condicion']['credito']['tipo'] === 2) {
      //A Cuotas
      if (data['condicion']['credito']['infoCuotas'] && data['condicion']['credito']['infoCuotas'].length > 0) {
        for (let i = 0; i < data['condicion']['credito']['infoCuotas'].length; i++) {
          const infoCuota = data['condicion']['credito']['infoCuotas'][i];

          if (constanteService.monedas.filter((um: any) => um.codigo === infoCuota['moneda']).length == 0) {
            this.errors.push(
              "Moneda '" +
                infoCuota['moneda'] +
                "' en data.condicion.credito.infoCuotas[" +
                i +
                '].moneda no encontrado. Valores: ' +
                constanteService.monedas.map((a: any) => a.codigo + '-' + a.descripcion),
            );
          }
        }
      } else {
        this.errors.push('Debe proporcionar data.condicion.credito.infoCuotas[]');
      }
    }
  }

  public generateDatosComplementariosComercialesDeUsoEspecificosValidate(params: any, data: any) {
    if (data['sectorEnergiaElectrica']) {
      this.generateDatosSectorEnergiaElectricaValidate(params, data);
    }

    if (data['sectorSeguros']) {
      this.generateDatosSectorSegurosValidate(params, data);
    }

    if (data['sectorSupermercados']) {
      this.generateDatosSectorSupermercadosValidate(params, data);
    }

    if (data['sectorAdicional']) {
      this.generateDatosDatosAdicionalesUsoComercialValidate(params, data);
    }
  }

  /**
   * E9.2. Sector Energía Eléctrica (E791-E799)
   *
   * @param params
   * @param data
   * @param options
   * @param items Es el item actual del array de items de "data" que se está iterando
   */
  private generateDatosSectorEnergiaElectricaValidate(params: any, data: any) {
    /*const jsonResult: any = {
      dNroMed: data['sectorEnergiaElectrica']['numeroMedidor'],
      dActiv: data['sectorEnergiaElectrica']['codigoActividad'],
      dCateg: data['sectorEnergiaElectrica']['codigoCategoria'],
      dLecAnt: data['sectorEnergiaElectrica']['lecturaAnterior'],
      dLecAct: data['sectorEnergiaElectrica']['lecturaActual'],
      dConKwh: data['sectorEnergiaElectrica']['lecturaActual'] - data['sectorEnergiaElectrica']['lecturaAnterior'],
    };*/

    if (data['sectorEnergiaElectrica']['lecturaAnterior'] > data['sectorEnergiaElectrica']['lecturaActual']) {
      this.errors.push('Sector Energia Electrica lecturaActual debe ser mayor a lecturaAnterior');
    }
  }

  /**
   * E9.3. Sector de Seguros (E800-E809)
   *
   * @param params
   * @param data
   * @param options
   * @param items Es el item actual del array de items de "data" que se está iterando
   */
  private generateDatosSectorSegurosValidate(params: any, data: any) {
    /*const jsonResult: any = {
      dCodEmpSeg: data['sectorSeguros']['codigoAseguradora'],
      gGrupPolSeg: {
        dPoliza: data['sectorSeguros']['codigoPoliza'],
        dUnidVig: data['sectorSeguros']['vigenciaUnidad'], //horas, dias, año
        dVigencia: data['sectorSeguros']['vigencia'],
        dNumPoliza: data['sectorSeguros']['numeroPoliza'],
        dFecIniVig: data['sectorSeguros']['inicioVigencia'],
        dFecFinVig: data['sectorSeguros']['finVigencia'],
        dCodInt: data['sectorSeguros']['codigoInternoItem'],
      },
    };*/
  }

  /**
   * E9.4. Sector de Supermercados (E810-E819
   *
   * @param params
   * @param data
   * @param options
   * @param items Es el item actual del array de items de "data" que se está iterando
   */
  private generateDatosSectorSupermercadosValidate(params: any, data: any) {
    /*const jsonResult: any = {
      dNomCaj: data['sectorSupermercados']['nombreCajero'],
      dEfectivo: data['sectorSupermercados']['efectivo'],
      dVuelto: data['sectorSupermercados']['vuelto'],
      dDonac: data['sectorSupermercados']['donacion'],
      dDesDonac: data['sectorSupermercados']['donacionDescripcion'].substring(0, 20),
    };*/
  }

  /**
   * E9.5. Grupo de datos adicionales de uso comercial (E820-E829)
   *
   * @param params
   * @param data
   * @param options
   * @param items Es el item actual del array de items de "data" que se está iterando
   */
  private generateDatosDatosAdicionalesUsoComercialValidate(params: any, data: any) {
    /*const jsonResult: any = {
      dCiclo: data['sectorAdicional']['ciclo'].substring(0, 15),
      dFecIniC: data['sectorAdicional']['inicioCiclo'],
      dFecFinC: data['sectorAdicional']['finCiclo'],
      dVencPag: data['sectorAdicional']['vencimientoPago'],
      dContrato: data['sectorAdicional']['numeroContrato'],
      dSalAnt: data['sectorAdicional']['saldoAnterior'],
    };*/

    if (data['sectorAdicional']['ciclo']) {
      if (
        !((data['sectorAdicional']['ciclo'] + '').length >= 1 && (data['sectorAdicional']['ciclo'] + '').length <= 15)
      ) {
        this.errors.push('El Ciclo en data.sectorAdicional.ciclo debe contener entre 1 y 15 caracteres ');
      }
    }

    if (data['sectorAdicional']['inicioCiclo']) {
      if (!((data['sectorAdicional']['inicioCiclo'] + '').length == 10)) {
        this.errors.push('El Inicio de Ciclo en data.sectorAdicional.inicioCiclo debe contener 10 caracteres ');
      }
    }

    if (data['sectorAdicional']['finCiclo']) {
      if (!((data['sectorAdicional']['finCiclo'] + '').length == 10)) {
        this.errors.push('El Fin de Ciclo en data.sectorAdicional.finCiclo debe contener 10 caracteres ');
      }
    }

    if (data['sectorAdicional']['vencimientoPago']) {
      if (!((data['sectorAdicional']['vencimientoPago'] + '').length == 10)) {
        this.errors.push('La fecha de Pago en data.sectorAdicional.vencimientoPago debe contener 10 caracteres ');
      }

      let fecha = new Date(data.fecha);
      let fechaPago = new Date(data['sectorAdicional']['vencimientoPago']);
      if (fecha.getTime() > fechaPago.getTime()) {
        this.errors.push(
          "La fecha de pago '" +
            data['sectorAdicional']['vencimientoPago'] +
            "' en data.sectorAdicional.vencimientoPago debe ser despues de la Fecha del Documento",
        );
      }
    }

    if (data['sectorAdicional']['numeroContrato']) {
      if (
        !(
          (data['sectorAdicional']['numeroContrato'] + '').length >= 1 &&
          (data['sectorAdicional']['numeroContrato'] + '').length <= 30
        )
      ) {
        this.errors.push(
          'El numero de Contrato en data.sectorAdicional.numeroContrato debe contener entre 1 y 30 caracteres ',
        );
      }
    }

    if (data['sectorAdicional']['saldoAnterior']) {
      /*if ( ! ( (data['sectorAdicional']['saldoAnterior']+"").length >= 1 && (data['sectorAdicional']['saldoAnterior']+"").length <= 30 ) ) {
        this.errors.push("El numero de Contrato en data.sectorAdicional.saldoAnterior debe contener entre 1 y 30 caracteres ");        
      }*/
    }
  }

  /**
   * E10. Campos que describen el transporte de las mercaderías (E900-E999)
   *
   * @param params
   * @param data
   * @param options
   */
  public generateDatosTransporteValidate(params: any, data: any) {
    if (data['tipoDocumento'] == 7) {
      if (!(data['detalleTransporte'] && data['detalleTransporte']['tipo'] && data['detalleTransporte']['tipo'] > 0)) {
        this.errors.push('Obligatorio informar detalleTransporte.tipo');
      }
    }
    if (data['detalleTransporte'] && data['detalleTransporte']['condicionNegociacion']) {
      if (constanteService.condicionesNegociaciones.indexOf(data['detalleTransporte']['condicionNegociacion']) < -1) {
        this.errors.push(
          'detalleTransporte.condicionNegociación (' +
            data['detalleTransporte']['condicionNegociacion'] +
            ') no válido',
        );
      }
    }
    if (data['tipoDocumento'] == 7) {
      if (!data['detalleTransporte']['inicioEstimadoTranslado']) {
        this.errors.push('Obligatorio informar data.detalleTransporte.inicioEstimadoTranslado. Formato yyyy-MM-dd');
      }
    }
    if (data['tipoDocumento'] == 7) {
      if (!data['detalleTransporte']['finEstimadoTranslado']) {
        this.errors.push('Obligatorio informar data.detalleTransporte.finEstimadoTranslado. Formato yyyy-MM-dd');
      }
    }

    if (data['tipoDocumento'] == 7) {
      if (data['detalleTransporte']['inicioEstimadoTranslado'] && data['detalleTransporte']['finEstimadoTranslado']) {
        let fechaInicio = new Date(data['detalleTransporte']['inicioEstimadoTranslado']);
        let fechaFin = new Date(data['detalleTransporte']['finEstimadoTranslado']);

        console.log('fechaHoy a', new Date().toISOString());
        console.log('fechaHoy b', new Date().toISOString().slice(0, -14));

        let fechaHoy = new Date(new Date().toISOString().slice(0, -14));
        fechaHoy.setHours(0);
        fechaHoy.setMinutes(0);
        fechaHoy.setSeconds(0);
        fechaHoy.setMilliseconds(0);

        console.log('fechaHoy', fechaHoy);
        console.log('fechaInicio', fechaInicio);
        console.log('fechaFin', fechaFin);

        if (fechaInicio.getTime() < fechaHoy.getTime()) {
          //this.errors.push('La fecha de inicio de translado en data.detalleTransporte.inicioEstimadoTranslado debe ser mayor a la Fecha de la Transacción');
        }

        if (fechaFin.getTime() < fechaInicio.getTime()) {
          //this.errors.push('La fecha de fin de translado en data.detalleTransporte.finEstimadoTranslado debe ser mayor a la Fecha de Inicio en data.detalleTransporte.inicioEstimadoTranslado');
        }
      }
    }
    if (constanteService.tiposTransportes.filter((um) => um.codigo === data['detalleTransporte']['tipo']).length == 0) {
      this.errors.push(
        "Tipo de Transporte '" +
          data['detalleTransporte']['tipo'] +
          "' en data.detalleTransporte.tipo no encontrado. Valores: " +
          constanteService.tiposTransportes.map((a) => a.codigo + '-' + a.descripcion),
      );
    }
    if (
      constanteService.modalidadesTransportes.filter((um) => um.codigo === data['detalleTransporte']['modalidad'])
        .length == 0
    ) {
      this.errors.push(
        "Modalidad de Transporte '" +
          data['detalleTransporte']['modalidad'] +
          "' en data.detalleTransporte.modalidad no encontrado. Valores: " +
          constanteService.modalidadesTransportes.map((a) => a.codigo + '-' + a.descripcion),
      );
    }

    if (
      constanteService.condicionesNegociaciones.filter(
        (um) => um.codigo === data['detalleTransporte']['condicionNegociacion'],
      ).length == 0
    ) {
      this.errors.push(
        "Condición de Negociación '" +
          data['detalleTransporte']['condicionNegociacion'] +
          "' en data.detalleTransporte.condicionNegociacion no encontrado. Valores: " +
          constanteService.condicionesNegociaciones.map((a) => a.codigo + '-' + a.descripcion),
      );
    }

    this.generateDatosSalidaValidate(params, data);
    this.generateDatosEntregaValidate(params, data);
    this.generateDatosVehiculoValidate(params, data);
    if (data['detalleTransporte']['transportista']) {
      this.generateDatosTransportistaValidate(params, data);
    }
  }

  /**
   * E10.1. Campos que identifican el local de salida de las mercaderías (E920-E939)
   *
   * @param params
   * @param data
   * @param options
   * @param items Es el item actual del array de items de "data" que se está iterando
   */
  private generateDatosSalidaValidate(params: any, data: any) {
    constanteService.validateDepartamentoDistritoCiudad(
      'data.detalleTransporte.salida',
      +data['detalleTransporte']['salida']['departamento'],
      +data['detalleTransporte']['salida']['distrito'],
      +data['detalleTransporte']['salida']['ciudad'],
      this.errors,
    );
  }

  /**
   * E10.2. Campos que identifican el local de entrega de las mercaderías (E940-E959)
   *
   * @param params
   * @param data
   * @param options
   * @param items Es el item actual del array de items de "data" que se está iterando
   */
  private generateDatosEntregaValidate(params: any, data: any) {
    /*
      const jsonResult: any = {
        dDirLocEnt: data['detalleTransporte']['entrega']['direccion'],
        dNumCasEnt: data['detalleTransporte']['entrega']['numeroCasa'],
        dComp1Ent: data['detalleTransporte']['entrega']['complementoDireccion1'],
        dComp2Ent: data['detalleTransporte']['entrega']['complementoDireccion1'],
        cDepEnt: data['detalleTransporte']['entrega']['departamento'],
        dDesDepEnt: constanteService.departamentos.filter(
          (td) => td.codigo === data['detalleTransporte']['entrega']['departamento'],
        )[0]['descripcion'],
        cDisEnt: data['detalleTransporte']['entrega']['distrito'],
        dDesDisEnt: constanteService.distritos.filter(
          (td) => td.codigo === data['detalleTransporte']['entrega']['distrito'],
        )[0]['descripcion'],
        cCiuEnt: data['detalleTransporte']['entrega']['ciudad'],
        dDesCiuEnt: constanteService.ciudades.filter(
          (td) => td.codigo === data['detalleTransporte']['entrega']['ciudad'],
        )[0]['descripcion'],
        //dTelEnt : data['detalleTransporte']['entrega']['telefonoContacto'],
      };
    */
  }

  /**
       * E10.3. Campos que identifican el vehículo de traslado de mercaderías (E960-E979)
  
       * 
       * @param params 
       * @param data 
       * @param options 
       * @param items Es el item actual del array de items de "data" que se está iterando
       */
  private generateDatosVehiculoValidate(params: any, data: any) {
    if (!(data['detalleTransporte'] && data['detalleTransporte']['vehiculo'])) {
      this.errors.push('Los datos del Vehiculo en data.detalleTransporte.vehiculo no fueron informados');
    }

    if (data['detalleTransporte']['vehiculo']['numeroMatricula']) {
      if (
        !(
          data['detalleTransporte']['vehiculo']['numeroMatricula'].length >= 6 &&
          data['detalleTransporte']['vehiculo']['numeroMatricula'].length <= 7
        )
      ) {
        this.errors.push(
          "Número de Matricula '" +
            data['detalleTransporte']['vehiculo']['numeroMatricula'] +
            "' en data.detalleTransporte.vehiculo.numeroMatricula debe tener una longitud de 6 a 7 caracteres ",
        );
      }
    }
  }

  /**
   * E10.4. Campos que identifican al transportista (persona física o jurídica) (E980-E999)
   *
   * @param params
   * @param data
   * @param options
   * @param items Es el item actual del array de items de "data" que se está iterando
   */
  private generateDatosTransportistaValidate(params: any, data: any) {
    if (
      constanteService.tiposDocumentosIdentidades.filter(
        (um) => um.codigo === data['detalleTransporte']['transportista']['documentoTipo'],
      ).length == 0
    ) {
      this.errors.push(
        "Tipo de Documento '" +
          data['detalleTransporte']['transportista']['documentoTipo'] +
          "' en data.detalleTransporte.transportista.documentoTipo no encontrado. Valores: " +
          constanteService.tiposDocumentosIdentidades.map((a) => a.codigo + '-' + a.descripcion),
      );
    }

    if (
      data['detalleTransporte'] &&
      data['detalleTransporte']['transportista'] &&
      data['detalleTransporte']['transportista']['ruc']
    ) {
      if (data['detalleTransporte']['transportista']['ruc'].indexOf('-') == -1) {
        this.errors.push('RUC debe contener dígito verificador en data.detalleTransporte.transportista.ruc');
      }
    }

    if (
      data['detalleTransporte'] &&
      data['detalleTransporte']['transportista'] &&
      data['detalleTransporte']['transportista']['agente'] &&
      data['detalleTransporte']['transportista']['agente']['ruc']
    ) {
      if (data['detalleTransporte']['transportista']['agente']['ruc'].indexOf('-') == -1) {
        this.errors.push('RUC debe contener dígito verificador en data.detalleTransporte.transportista.agente.ruc');
      }
    }

    if (data['detalleTransporte']['transportista'] && data['detalleTransporte']['transportista']['pais']) {
      if (
        constanteService.paises.filter(
          (pais: any) => pais.codigo === data['detalleTransporte']['transportista']['pais'],
        ).length == 0
      ) {
        this.errors.push(
          "Pais '" +
            data['detalleTransporte']['transportista']['pais'] +
            "' del Cliente en data.detalleTransporte.transportista.pais no encontrado. Valores: " +
            constanteService.paises.map((a: any) => a.codigo + '-' + a.descripcion),
        );
      }
    }
  }

  public generateDatosTotalesValidate(params: any, data: any) {
    if (data['moneda'] != 'PYG' && data['condicionTipoCambio'] == 1) {
      if (!data['cambio']) {
        this.errors.push(
          'Debe especificar el valor del Cambio en data.cambio cuando moneda != PYG y la Cotización es Global',
        );
      }
    }
  }

  /**
   * G. Campos complementarios comerciales de uso general (G001-G049)
   *
   * @param params
   * @param data
   * @param options
   */
  public generateDatosComercialesUsoGeneralValidate(params: any, data: any) {
    const jsonResult: any = {
      //dOrdCompra : data['complementarios']['ordenCompra'],
      //dOrdVta : data['complementarios']['ordenVenta'],
      //dAsiento : data['complementarios']['numeroAsiento']
    };

    if (data['tipoDocumento'] == 1 || data['tipoDocumento'] == 7) {
      //Opcional si 1 o 7
      if (
        (data['complementarios'] &&
          data['complementarios']['carga'] &&
          data['complementarios']['carga']['volumenTotal']) ||
        (data['complementarios'] && data['complementarios']['carga'] && data['complementarios']['carga']['pesoTotal'])
      ) {
        this.generateDatosCargaValidate(params, data);
      }
    }
  }

  /**
   * G1. Campos generales de la carga (G050 - G099)
   *
   * @param params
   * @param data
   * @param options
   */
  private generateDatosCargaValidate(params: any, data: any) {
    //TODO ALL
    /*const jsonResult: any = {
      cUniMedTotVol : data['complementarios']['carga']['unidadMedida'], 
            dDesUniMedTotVol : data['complementarios']['carga']['ordenVenta'],
            dTotVolMerc : data['complementarios']['carga']['totalVolumenMercaderia'],
            cUniMedTotPes : data['complementarios']['carga']['numeroAsiento'],
            dDesUniMedTotPes : data['complementarios']['carga']['numeroAsiento'],
            dTotPesMerc : data['complementarios']['carga']['numeroAsiento'],
            iCarCarga : data['complementarios']['carga']['numeroAsiento'],
            dDesCarCarga : data['complementarios']['carga']['numeroAsiento'],
    };*/

    if (
      data['complementarios'] &&
      data['complementarios']['carga'] &&
      data['complementarios']['carga']['unidadMedidaVolumenTotal']
    ) {
      if (
        constanteService.unidadesMedidas.filter(
          (um) => um.codigo === data['complementarios']['carga']['unidadMedidaVolumenTotal'],
        ).length == 0
      ) {
        this.errors.push(
          "Unidad de Medida '" +
            data['complementarios']['carga']['unidadMedidaVolumenTotal'] +
            "' en data.complementarios.carga.unidadMedidaVolumenTotal no válido. Valores: " +
            constanteService.unidadesMedidas.map((a) => a.codigo + '-' + a.descripcion.trim()),
        );
      }
    }

    if (
      data['complementarios'] &&
      data['complementarios']['carga'] &&
      data['complementarios']['carga']['unidadMedidaPesoTotal']
    ) {
      if (
        constanteService.unidadesMedidas.filter(
          (um) => um.codigo === data['complementarios']['carga']['unidadMedidaPesoTotal'],
        ).length == 0
      ) {
        this.errors.push(
          "Unidad de Medida '" +
            data['complementarios']['carga']['unidadMedidaPesoTotal'] +
            "' en data.complementarios.carga.unidadMedidaPesoTotal no válido. Valores: " +
            constanteService.unidadesMedidas.map((a) => a.codigo + '-' + a.descripcion.trim()),
        );
      }
    }

    if (
      data['complementarios'] &&
      data['complementarios']['carga'] &&
      data['complementarios']['carga']['caracteristicaCarga']
    ) {
      if (
        constanteService.caracteristicasCargas.filter(
          (um) => um.codigo === data['complementarios']['carga']['caracteristicaCarga'],
        ).length == 0
      ) {
        this.errors.push(
          "Característica de Carga '" +
            data['complementarios']['carga']['caracteristicaCarga'] +
            "' en data.complementarios.carga.caracteristicaCarga no válido. Valores: " +
            constanteService.caracteristicasCargas.map((a) => a.codigo + '-' + a.descripcion),
        );
      }

      if (data['complementarios']['carga']['caracteristicaCarga'] == 3) {
        if (!data['complementarios']['carga']['caracteristicaCargaDescripcion']) {
          this.errors.push(
            'Para data.complementarios.carga.caracteristicaCarga = 3 debe informar el campo data.complementarios.carga.caracteristicaCargaDescripcion',
          );
        }
      }
    }
  }

  /**
   * H. Campos que identifican al documento asociado (H001-H049)
   *
   * @param params
   * @param data
   * @param options
   */
  public generateDatosDocumentoAsociadoValidate(params: any, data: any) {
    if (data['tipoTransaccion'] == 11 && !data['documentoAsociado']['resolucionCreditoFiscal']) {
      this.errors.push('Obligatorio informar data.documentoAsociado.resolucionCreditoFiscal');
    }

    //Validaciones
    if (
      constanteService.tiposDocumentosAsociados.filter((um) => um.codigo === data['documentoAsociado']['formato'])
        .length == 0
    ) {
      this.errors.push(
        "Formato de Documento Asociado '" +
          data['documentoAsociado']['formato'] +
          "' en data.documentoAsociado.formato no encontrado. Valores: " +
          constanteService.tiposDocumentosAsociados.map((a) => a.codigo + '-' + a.descripcion),
      );
    }

    if (data['documentoAsociado']['tipo'] == 2) {
      if (
        constanteService.tiposDocumentosImpresos.filter(
          (um) => um.codigo === data['documentoAsociado']['tipoDocumentoImpreso'],
        ).length == 0
      ) {
        this.errors.push(
          "Tipo de Documento impreso '" +
            data['documentoAsociado']['tipoDocumentoImpreso'] +
            "' en data.documentoAsociado.tipoDocumentoImpreso no encontrado. Valores: " +
            constanteService.tiposDocumentosImpresos.map((a) => a.codigo + '-' + a.descripcion),
        );
      }
    }

    if (data['documentoAsociado']['formato'] == 1) {
      //H002 = Electronico
      if (!(data['documentoAsociado']['cdc'] && data['documentoAsociado']['cdc'].length >= 44)) {
        this.errors.push('Debe indicar el CDC asociado en data.documentoAsociado.cdc');
      }
    }

    if (data['documentoAsociado']['formato'] == 2) {
      //H002 = Impreso
      if (!data['documentoAsociado']['timbrado']) {
        this.errors.push(
          'Debe especificar el Timbrado del Documento impreso Asociado en data.documentoAsociado.timbrado',
        );
      }
      if (!data['documentoAsociado']['establecimiento']) {
        this.errors.push(
          'Debe especificar el Establecimiento del Documento impreso Asociado en data.documentoAsociado.establecimiento',
        );
      }
      if (!data['documentoAsociado']['punto']) {
        this.errors.push('Debe especificar el Punto del Documento impreso Asociado en data.documentoAsociado.punto');
      }

      if (!data['documentoAsociado']['numero']) {
        this.errors.push('Debe especificar el Número del Documento impreso Asociado en data.documentoAsociado.numero');
      }

      if (!data['documentoAsociado']['tipoDocumentoImpreso']) {
        this.errors.push(
          'Debe especificar el Tipo del Documento Impreso Asociado en data.documentoAsociado.tipoDocumentoImpreso',
        );
      }

      if (data['documentoAsociado']['fecha']) {
        if ((data['documentoAsociado']['fecha'] + '').length != 10) {
          this.errors.push(
            'La Fecha del Documento impreso Asociado en data.documentoAsociado.fecha debe tener una longitud de 10 caracteres',
          );
        }
      } else {
        this.errors.push('Debe especificar la Fecha del Documento impreso Asociado en data.documentoAsociado.fecha');
      }
    }

    if (data['documentoAsociado']['formato'] == 3) {
      //H002 = Constancia electronica
      if (data['documentoAsociado']['constanciaTipo']) {
        if (
          constanteService.tiposConstancias.filter((um) => um.codigo === data['documentoAsociado']['constanciaTipo'])
            .length == 0
        ) {
          this.errors.push(
            "Tipo de Constancia '" +
              data['documentoAsociado']['constanciaTipo'] +
              "' en data.documentoAsociado.constanciaTipo no encontrado. Valores: " +
              constanteService.tiposConstancias.map((a) => a.codigo + '-' + a.descripcion),
          );
        }
      }
    }
  }
}

export default new JSonDeMainValidateService();
