export interface Location {
    name: string;
    region?: string;
    country?: string;
    lat: number;
    lon: number;
    tz_id?: string;
    localtime_epoch?: number;
    localtime?: string;
}

export interface Condition {
    text: string;
    icon?: string;
    code?: number;
}

export interface AirQuality {
    co: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    'us-epa-index': number;
    'gb-defra-index': number;
}

export interface APIAstronomy {
    astronomy: {
        Location?: Location;
        astro: {
            sunrise: number;
            sunset: number;
            moonrise:number;
            moonset:number;
            moon_phase: number;
            moon_illumination: number;
        }
    }
}

export interface Astronomy {
    Location?: Location;
    astro: {
        sunrise: number;
        sunset: number;
        moonrise:number;
        moonset:number;
        moon_phase: number;
        moon_illumination: number;
    }
}

export interface Weather {
    location: Location,
    current: {
        last_updated_epoch: number;
        last_updated?: string;
        temp_c?: number;
        temp_f: number;
        is_day: boolean;
        condition: Condition;
        wind_mph: number;
        wind_kph?: number;
        wind_degree: number;
        wind_dir?: string;
        pressure_mb: number;
        pressure_in?: number;
        precip_mm: number;
        precip_in?: number;
        humidity: number;
        cloud: number;
        feelslike_c?: number;
        feelslike_f: number;
        vis_km?: number;
        vis_miles: number;
        uv: number;
        gust_mph: number;
        gust_kph?: number;
        air_quality?: AirQuality;
        astronomy? : Astronomy;
    }
}
