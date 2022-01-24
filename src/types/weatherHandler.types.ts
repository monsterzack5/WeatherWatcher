export interface doesRowExist {
    [index: string]: boolean
}

export interface DBWeather {
    epoch: number;
    temp_f: number;
    is_day: boolean;
    condition: string;
    wind_mph: number;
    wind_degree: number;
    pressure_mb: number;
    precip_mm: number;
    humidity: number;
    cloudy: number;
    feels_like_f: number;
    visablity_miles: number;
    uv: number;
    gust_mph: number;
    zip: string;
}

export interface DBLocation {
    name: string;
    lat: number;
    lon: number;
    zip: string;
}

export interface DBAirQuality {
    co: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    us_epa_index: number;
    gb_defra_index: number;
}

export interface DBRequestTime {
    time: number;
    zip: string;
}

export interface DBAstronomy {
    date: string;
    sunrise: number;
    sunset: number;
    moonrise:number;
    moonset:number;
    moon_phase: number;
    moon_illumination: number;
    zip: string;
}
