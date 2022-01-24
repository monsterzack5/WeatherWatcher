CREATE TABLE IF NOT EXISTS location (
    name TEXT PRIMARY KEY,
    lat INTEGER NOT NULL,
    lon INTEGER NOT NULL,
    zip TEXT NOT NULL UNIQUE
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS weather (
    _uid INTEGER PRIMARY KEY AUTOINCREMENT,
    epoch INTEGER NOT NULL, 
    temp_f INTEGER NOT NULL,
    is_day BOOLEAN NOT NULL,
    condition TEXT NOT NULL,
    wind_mph INTEGER NOT NULL,
    wind_degree INTEGER NOT NULL,
    pressure_mb INTEGER NOT NULL,
    precip_mm INTEGER NOT NULL,
    humidity INTEGER NOT NULL,
    cloudy INTEGER NOT NULL,
    feels_like_f INTEGER NOT NULL,
    visablity_miles INTEGER NOT NULL,
    uv INTEGER NOT NULL,
    gust_mph INTEGER NOT NULL,

    zip TEXT NOT NULL,

    FOREIGN KEY (zip) REFERENCES location(zip)
);

CREATE TABLE IF NOT EXISTS air_quality (
    _uid INTEGER PRIMARY KEY AUTOINCREMENT,
    epoch INTEGER NOT NULL,
    co INTEGER NOT NULL,
    no2 INTEGER NOT NULL,
    o3 INTEGER NOT NULL,
    so2 INTEGER NOT NULL,
    pm2_5 INTEGER NOT NULL,
    pm10 INTEGER NOT NULL,
    us_epa_index INTEGER NOT NULL,
    gb_defra_index INTEGER NOT NULL,

    zip INTEGER NOT NULL,

    FOREIGN KEY (zip) REFERENCES location(zip)
);

CREATE TABLE IF NOT EXISTS astronomy (
    date TEXT PRIMARY KEY,
    sunrise TEXT NOT NULL,
    sunset TEXT NOT NULL,
    moonrise TEXT NOT NULL,
    moonset TEXT NOT NULL,
    moon_phase TEXT NOT NULL,
    moon_illumination INTEGER NOT NULL ,

    zip INTEGER NOT NULL,
    
    FOREIGN KEY (zip) REFERENCES location(zip)
) WITHOUT ROWID;