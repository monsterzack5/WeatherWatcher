import Cron from 'croner';
import { Logger } from '../utils/logger.js';
import { updateCurrentWeather, updateCurrentAstronomy } from '../utils/weatherHandler.js';

export const updateHomeWeatherHandler = new Cron('*/15 * * * *', async () => {
    await updateCurrentWeather(process.env.HOME_ZIP_CODE as string);
    await updateCurrentAstronomy(process.env.HOME_ZIP_CODE as string);
    if (process.env.NODE_ENV === 'dev') {
        Logger.log('Updating Home Weather!');
    }
});
