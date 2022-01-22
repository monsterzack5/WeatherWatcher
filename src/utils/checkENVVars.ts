export function checkENVVars(): boolean {
    if (process.env.DB_FILE && typeof process.env.DB_FILE === 'string'
        && process.env.NODE_ENV && typeof process.env.NODE_ENV === 'string'
        && process.env.WEATHER_API_KEY && typeof process.env.WEATHER_API_KEY === 'string'
        && process.env.HOME_ZIP_CODE && typeof process.env.HOME_ZIP_CODE === 'string') {
        return true;
    }
    return false;
}
