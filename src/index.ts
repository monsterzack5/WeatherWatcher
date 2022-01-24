import express from 'express';
import cors from 'cors';
import { checkENVVars } from './utils/checkENVVars.js';
import { Logger } from './utils/logger.js';
import weatherRouter from './routes/weather.js';
import { db } from './utils/database.js';
import { updateHomeWeatherHandler } from './jobs/updateLocalWeather.js';

if (!checkENVVars()) {
    Logger.warn('FATAL: ENV Vars are not properly set!');
    process.exit(1);
}

// Express
const app = express();
const port = process.env.PORT ?? 5555;

app.use(express.json());
app.use(cors());

app.use('/weather', weatherRouter);

app.all('*', (_, res) => res.status(400).json({ error: 'Page Not Found' }));

const server = app.listen(port, () => {
    Logger.log(`Server Listening on port ${port}`);
});

// SIGINT/TERM Handling
let endSignalCount = 0;

process.on('SIGINT', () => {
    endSignalCount += 1;

    if (endSignalCount > 3) {
        process.exit(1);
    }

    db.close();
    server.close();
    updateHomeWeatherHandler.stop();
    Logger.log('Received SIGINT, Shutting Down!');
});

process.on('SIGTERM', () => {
    endSignalCount += 1;

    if (endSignalCount > 3) {
        process.exit(1);
    }

    db.close();
    server.close();
    updateHomeWeatherHandler.stop();
    Logger.log('Received SIGTERM, Shutting Down!');
});
