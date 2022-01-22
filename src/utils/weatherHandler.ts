import got from 'got';
import { Logger } from './logger.js';
import { db, memDb } from './database.js';

import type { APIAstronomy, Weather } from '../types/weather.types';
import {
    DBAirQuality, DBAstronomy, DBLocation, DBRequestTime, DBWeather, doesRowExist,
} from '../types/weatherHandler.types.js';

const baseUrl = 'https://api.weatherapi.com/v1/';

/* Main DB */
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

const insertAstronomyWithZip = db.prepare(`INSERT INTO astronomy (epoch, sunrise, sunset, moonrise, moonset, 
    moon_phase, moon_illumination, zip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const existsWeatherOnZipAndEpoch = db.prepare(
    'SELECT EXISTS (SELECT 1 FROM weather WHERE epoch = ? AND zip = ? LIMIT 1)',
);

const existsLocationWithZip = db.prepare('SELECT EXISTS (SELECT 1 FROM location WHERE zip = ? LIMIT 1)');

const selectNewestWeatherEntryEpoch = db.prepare('SELECT * FROM weather ORDER BY _uid DESC LIMIT 1');

const selectLocationFromZip = db.prepare('SELECT * FROM location WHERE zip = ?');

const selectAirQualityFromEpochAndZip = db.prepare('SELECT * FROM air_quality WHERE epoch = ? AND zip = ?');

const selectAstronomyFromEpochAndZip = db.prepare('SELECT * FROM astronomy WHERE epoch = ? AND zip = ?');

/* Inmemory DB */

const updateLastRequestTime = memDb.prepare('INSERT OR REPLACE INTO request_times (zip, time) VALUES (?, ?)');

const selectLastRequestTimeOnZip = memDb.prepare('SELECT * FROM request_times WHERE zip = ?');

function isCurrentWeatherSaved(lastUpdatedEpoch: number, zip: string): boolean {
    const doesExist: doesRowExist = existsWeatherOnZipAndEpoch.get(lastUpdatedEpoch, zip);
    return Object.values(doesExist)[0];
}

function isLocationSaved(zip: string): boolean {
    const isSaved: doesRowExist = existsLocationWithZip.get(zip);
    return Object.values(isSaved)[0];
}

function saveLocation(name: string, lat: number, lon: number, zip: string): void {
    insertLocationWithZip.run(name, lat, lon, zip);
}

function stripCurrentWeather(weather: Weather): Weather {
    const w = weather;

    delete w.location.country;
    delete w.location.region;
    delete w.location.tz_id;
    delete w.location.localtime_epoch;
    delete w.location.localtime;

    delete w.current.last_updated;
    delete w.current.temp_c;
    delete w.current.wind_kph;
    delete w.current.wind_dir;
    delete w.current.pressure_in;
    delete w.current.precip_in;
    delete w.current.feelslike_c;
    delete w.current.vis_km;
    delete w.current.gust_kph;

    delete w.current.astronomy?.Location;

    return w;
}

function convertDBWeatherToCurrentWeather(weather: DBWeather, zip: string): Weather {
    const locationInfo: DBLocation = selectLocationFromZip.get(weather.zip);
    const airQualitytInfo: DBAirQuality = selectAirQualityFromEpochAndZip.get(weather.epoch, zip);
    const astronomyInfo: DBAstronomy = selectAstronomyFromEpochAndZip.get(weather.epoch, zip);

    return {
        location: {
            name: locationInfo.name,
            lat: locationInfo.lat,
            lon: locationInfo.lon,
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
                co: airQualitytInfo.co,
                no2: airQualitytInfo.no2,
                o3: airQualitytInfo.o3,
                so2: airQualitytInfo.so2,
                pm2_5: airQualitytInfo.pm2_5,
                pm10: airQualitytInfo.pm10,
                'us-epa-index': airQualitytInfo.us_epa_index,
                'gb-defra-index': airQualitytInfo.gb_defra_index,
            },
            astronomy: {
                astro: {
                    sunrise: astronomyInfo.sunrise,
                    sunset: astronomyInfo.sunset,
                    moonrise: astronomyInfo.moonrise,
                    moonset: astronomyInfo.moonset,
                    moon_phase: astronomyInfo.moon_phase,
                    moon_illumination: astronomyInfo.moon_illumination,
                },
            },
        },
    };
}

function saveCurrentWeather(w: Weather, zipCode: string): void {
    // check if we have the location saved, if not save it first
    if (!isLocationSaved(zipCode)) {
        saveLocation(w.location.name, w.location.lat, w.location.lon, zipCode);
    }

    if (w.current.air_quality) {
        insertAirQualityWithZip.run(
            w.current.last_updated_epoch,
            w.current.air_quality.co,
            w.current.air_quality.no2,
            w.current.air_quality.o3,
            w.current.air_quality.so2,
            w.current.air_quality.pm2_5,
            w.current.air_quality.pm10,
            w.current.air_quality['us-epa-index'],
            w.current.air_quality['gb-defra-index'],
            zipCode,
        );
    }

    if (w.current.astronomy) {
        insertAstronomyWithZip.run(
            w.current.last_updated_epoch,
            w.current.astronomy.astro.sunrise,
            w.current.astronomy.astro.sunset,
            w.current.astronomy.astro.moonrise,
            w.current.astronomy.astro.moonset,
            w.current.astronomy.astro.moon_phase,
            w.current.astronomy.astro.moon_illumination,
            zipCode,
        );
    }

    insertCurrentWeatherWithZip.run(
        w.current.last_updated_epoch,
        w.current.temp_f,
        w.current.is_day,
        w.current.condition.text,
        w.current.wind_mph,
        w.current.wind_degree,
        w.current.pressure_mb,
        w.current.precip_mm,
        w.current.humidity,
        w.current.cloud,
        w.current.feelslike_f,
        w.current.vis_miles,
        w.current.uv,
        w.current.gust_mph,
        zipCode,
    );
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

export async function getCurrentWeather(zipCode: string): Promise<Weather | void> {
    // Check to see if the last request was within 10 minutes
    const lastRequestTime: DBRequestTime = selectLastRequestTimeOnZip.get(zipCode);
    if (lastRequestTime && Date.now() - lastRequestTime.time <= 10 * 60 * 1000) {
        // if so, return weather from db.
        const latestEntry: DBWeather = selectNewestWeatherEntryEpoch.get();
        return convertDBWeatherToCurrentWeather(latestEntry, zipCode);
    }

    updateLastRequestTime.run(zipCode, Date.now());

    const weather = await getJSON<Weather>(`current.json?key=${process.env.WEATHER_API_KEY}&q=${zipCode}&aqi=yes`);

    // if the API told us to get bent, check to see if its in the DB
    if (!weather) {
        // Check if stored weather info is within ~15 minutes from now..\\
        const latestEntry: DBWeather = selectNewestWeatherEntryEpoch.get();
        if (Date.now() - latestEntry.epoch <= 15 * 60 * 1000) {
            // Latest data is within 15 minutes, convert then return it.
            return convertDBWeatherToCurrentWeather(latestEntry, zipCode);
        }
        // We tried our best.
        return undefined;
    }

    // WeatherAPI returns the epoch in seconds, but we want to treat it as if it were milliseconds.
    weather.current.last_updated_epoch *= 1000;

    // If we already have it saved, just pass it along
    if (isCurrentWeatherSaved(weather.current.last_updated_epoch, zipCode)) {
        return stripCurrentWeather(weather);
    }

    // Convert the current day into YYYY-MM-DD format
    const formatedDate = new Date().toISOString().split('T')[0];
    const astro = await getJSON<APIAstronomy>(`astronomy.json?key=${process.env.WEATHER_API_KEY}&q=${zipCode}&dt=${formatedDate}`);

    if (astro) {
        weather.current.astronomy = astro.astronomy;
    }

    saveCurrentWeather(weather, zipCode);
    return stripCurrentWeather(weather);
}
