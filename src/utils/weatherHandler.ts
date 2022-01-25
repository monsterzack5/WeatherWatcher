import got from 'got';
import { Logger } from './logger.js';
import { db } from './database.js';

import type {
    APIAstronomy, APILocation, APIWeather, ReturnedWeather,
} from '../types/weather.types';
import {
    DBAirQuality, DBAstronomy, DBLocation, DBWeather, doesRowExist,
} from '../types/weatherHandler.types.js';

const baseUrl = 'https://api.weatherapi.com/v1/';

/* DB Calls */
const insertCurrentWeatherWithZip = db.prepare(
    `INSERT INTO weather (epoch, temp_f, is_day, condition, wind_mph, wind_degree, 
        pressure_mb, precip_mm, humidity, cloudy, feels_like_f, visablity_miles, uv, gust_mph,
        zip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

const insertLocationWithZip = db.prepare('INSERT INTO location (name, lat, lon, zip) VALUES (?, ?, ?, ?)');

const insertAirQualityWithZip = db.prepare(`INSERT INTO air_quality (epoch, co, no2, o3, so2, pm2_5, 
    pm10, us_epa_index, gb_defra_index, zip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const insertAstronomyWithZip = db.prepare(`INSERT INTO astronomy (date, sunrise, sunset, moonrise, moonset, 
    moon_phase, moon_illumination, zip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const existsLocationWithZip = db.prepare('SELECT EXISTS (SELECT 1 FROM location WHERE zip = ? LIMIT 1)');

const selectNewestWeatherEntryEpoch = db.prepare('SELECT * FROM weather ORDER BY _uid DESC LIMIT 1');

const selectLocationFromZip = db.prepare('SELECT * FROM location WHERE zip = ?');

const selectAirQualityFromEpochAndZip = db.prepare('SELECT * FROM air_quality WHERE epoch = ? AND zip = ?');

const selectAstroFromDateAndZip = db.prepare('SELECT * FROM astronomy WHERE date = ? AND zip = ?');

/* End DB Calls */

function createReturnableWeather(weather: DBWeather, astro: DBAstronomy, location: DBLocation, airQuality: DBAirQuality)
    : ReturnedWeather {
    return {
        location: {
            name: location.name,
            lat: location.lat,
            lon: location.lon,
        },
        current: {
            last_updated_epoch: weather.epoch,
            temp_f: weather.temp_f,
            is_day: weather.is_day,
            condition: {
                text: weather.condition,
            },
            wind_mph: weather.wind_mph,
            wind_degree: weather.wind_degree,
            pressure_mb: weather.pressure_mb,
            precip_mm: weather.precip_mm,
            humidity: weather.humidity,
            cloud: weather.cloudy,
            feelslike_f: weather.feels_like_f,
            vis_miles: weather.visablity_miles,
            uv: weather.uv,
            gust_mph: weather.gust_mph,
            air_quality: {
                co: airQuality.co,
                no2: airQuality.no2,
                o3: airQuality.o3,
                so2: airQuality.so2,
                pm2_5: airQuality.pm2_5,
                pm10: airQuality.pm10,
                'us-epa-index': airQuality.us_epa_index,
                'gb-defra-index': airQuality.gb_defra_index,
            },
            astronomy: {
                astro: {
                    sunrise: astro.sunrise,
                    sunset: astro.sunset,
                    moonrise: astro.moonrise,
                    moonset: astro.moonset,
                    moon_phase: astro.moon_phase,
                    moon_illumination: astro.moon_illumination,
                },
            },
        },
    };
}

function saveLocationIfNeeded(zipCode: string, location: APILocation): void {
    const isSaved: doesRowExist = existsLocationWithZip.get(zipCode);
    if (!Object.values(isSaved)[0]) {
        insertLocationWithZip.run(location.name, location.lat, location.lon, zipCode);
    }
}

// Returns a YYYY-MM-DD formated string.
function getISODate(): string {
    return new Date().toISOString().split('T')[0];
}

async function getJSON<T>(url: string): Promise<T | void> {
    try {
        const req = await got(`${baseUrl}${url}`, {
            headers: {
                Agent: 'WeatherWatcher-LoHo',
            },
            responseType: 'json',
        });
        return req.body as T;
    } catch (e) {
        return Logger.error('weather::getJSON', e as Error);
    }
}

// This function should only try to update the weather in the DB.
export async function updateCurrentWeather(zipCode: string): Promise<boolean> {
    try {
        const weather = await getJSON<APIWeather>(`current.json?key=${process.env.WEATHER_API_KEY}&q=${zipCode}&aqi=yes`);

        if (!weather || !weather.current || !weather.current.air_quality) {
            return false;
        }

        saveLocationIfNeeded(zipCode, weather.location);

        // WeatherAPI.com returns the epoch in seconds, So convert it to milliseconds for ease of use.
        weather.current.last_updated_epoch *= 1000;
        insertCurrentWeatherWithZip.run(
            weather.current.last_updated_epoch,
            weather.current.temp_f,
            weather.current.is_day,
            weather.current.condition.text,
            weather.current.wind_mph,
            weather.current.wind_degree,
            weather.current.pressure_mb,
            weather.current.precip_mm,
            weather.current.humidity,
            weather.current.cloud,
            weather.current.feelslike_f,
            weather.current.vis_miles,
            weather.current.uv,
            weather.current.gust_mph,
            zipCode,
        );

        insertAirQualityWithZip.run(
            weather.current.last_updated_epoch,
            weather.current.air_quality.co,
            weather.current.air_quality.no2,
            weather.current.air_quality.o3,
            weather.current.air_quality.so2,
            weather.current.air_quality.pm2_5,
            weather.current.air_quality.pm10,
            weather.current.air_quality['us-epa-index'],
            weather.current.air_quality['gb-defra-index'],
            zipCode,
        );
    } catch (e) {
        Logger.error('weatherHandler::updateCurrentWeather', e as Error);
        return false;
    }
    return true;
}

// Deplication is prohibited by sqlite via using the formatedDate as a Primary Key
// Though, we should not rely on this.
export async function updateCurrentAstronomy(zipCode: string): Promise<boolean> {
    // Convert the current day into YYYY-MM-DD format
    const formatedDate = getISODate();
    try {
        const currentAstro = await getJSON<APIAstronomy>(`astronomy.json?key=${process.env.WEATHER_API_KEY}&q=${zipCode}&dt=${formatedDate}`);

        if (!currentAstro || !currentAstro.astronomy || !currentAstro.location) {
            return false;
        }

        saveLocationIfNeeded(zipCode, currentAstro.location);
        insertAstronomyWithZip.run(
            formatedDate,
            currentAstro.astronomy.astro.sunrise,
            currentAstro.astronomy.astro.sunset,
            currentAstro.astronomy.astro.moonrise,
            currentAstro.astronomy.astro.moonset,
            currentAstro.astronomy.astro.moon_phase,
            currentAstro.astronomy.astro.moon_illumination,
            zipCode,
        );
    } catch (e) {
        Logger.error('weatherHander::updateCurrentAstro', e as Error);
        return false;
    }
    return true;
}

export async function getCurrentWeather(zipCode: string): Promise<ReturnedWeather | void> {
    let latestWeather: DBWeather = selectNewestWeatherEntryEpoch.get();

    // Weather in the DB is older than 10 minutes, lets update it.
    if (!latestWeather || Date.now() - latestWeather.epoch >= (10 * 60 * 1000)) {
        await updateCurrentWeather(zipCode);
        latestWeather = selectNewestWeatherEntryEpoch.get();
    }

    // If no astro data is returned, it is outdated.
    const formatedDate = getISODate();
    let latestAstro: DBAstronomy = selectAstroFromDateAndZip.get(formatedDate, zipCode);

    if (!latestAstro) {
        await updateCurrentAstronomy(zipCode);
        latestAstro = selectAstroFromDateAndZip.get(formatedDate, zipCode);
    }

    const location: DBLocation = selectLocationFromZip.get(zipCode);
    const airQuality: DBAirQuality = selectAirQualityFromEpochAndZip.get(latestWeather.epoch, zipCode);

    return createReturnableWeather(latestWeather, latestAstro, location, airQuality);
}
