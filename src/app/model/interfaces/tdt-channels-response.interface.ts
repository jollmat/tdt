export interface TdtChannelsResponse {
    countries: TdtChannelsCountry[]
}

export interface TdtChannelsCountry {
    name: string, 
    ambits: TdtChannelsAmbit[]
}

export interface TdtChannelsAmbit {
    name: string, 
    channels: TdtChannel[]
}

export interface TdtChannel {
    epg_id: string,
    extra_info: string[],
    logo: string,
    name: string,
    options: TdtChannelOption[],
    web: string
}

export interface TdtChannelOption {
    format: string,
    url: string,
    geo2?: string,
    lang?: string,
    res?: string
}