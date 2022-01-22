import { Router } from 'express';
import type { Request } from 'express';
import { getCurrentWeather } from '../utils/weatherHandler.js';

const weatherRouter = Router();

weatherRouter.get('/current/:zip', async (req: Request<{ zip?: string}>, res) => {
    if (req.params.zip && req.params.zip.length === 5) {
        const weather = await getCurrentWeather(req.params.zip);
        if (weather) {
            res.json(weather);
            return;
        }
        res.status(500).json({ error: 'cannot aquire current weather info from WeatherAPI.com' });
        return;
    }
    res.status(400).json({ error: 'invalid zip code' });
});

export default weatherRouter;
