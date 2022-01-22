import Cron from 'croner';
import { Logger } from '../utils/logger.js';
import { getCurrentWeather } from '../utils/weatherHandler.js';

export const updateHomeWeatherHandler = new Cron('*/15 * * * *', () => {
    getCurrentWeather(process.env.HOME_ZIP_CODE as string);
    if (process.env.NODE_ENV === 'dev') {
        Logger.log('Updating Current Weather');
    }
});
