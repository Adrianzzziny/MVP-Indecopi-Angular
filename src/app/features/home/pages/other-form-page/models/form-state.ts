export type TipoRepresentacion = 'juridica' | 'natural' | null;

export interface PersonalInfo {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    codigoPais: string;
    celular: string;
    departamento: string;
    provincia: string;
    distrito: string;

    tipoRepresentacion: TipoRepresentacion;
    ruc?: string;
    razonSocial?: string;
    leDni?: string;
    nombresCompletos?: string;
}

export interface RecipientInfo {
    sede: string;
    areaDestino: string;
    asunto: string;
}

export interface FileData {
    tipoDocumento: string;
    numeroExpediente?: string;
    documentoPrincipal: File | null;
    anexos: File[];
}

export interface FormData {
    personal?: PersonalInfo;
    recipient?: RecipientInfo;
    files?: FileData;
}
