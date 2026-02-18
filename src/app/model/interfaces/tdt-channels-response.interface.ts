export interface TdtChannelsResponse {
    countries: TdtChannelsCountry[],
    epg?: TdtEpgSource
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
    epg_id?: string,
    extra_info: string[],
    logo: string,
    name: string,
    options: TdtChannelOption[],
    web: string,
    flagClassName?: string,
    countryName?: string
}

export interface TdtChannelOption {
    format: string,
    url: string,
    geo2?: string,
    lang?: string,
    res?: string
}

export interface TdtEpgSource {
    json?: string,
    xml?: string
}

export interface TdtEpgItem {
    name: string,
    events: TdtEpgItemEvent[]
}

export interface TdtEpgItemEvent {
    hi: Date,
    hf: Date,
    t: string, // Title
    d: string, // Description
    g?: any,
    c?: string // Image
}