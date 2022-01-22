import Sqlite from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { Logger } from './logger.js';

function execScema(db: Sqlite.Database, schemaFile: string): void {
    if (existsSync(schemaFile)) {
        const schema = readFileSync(schemaFile, 'utf-8');
        try {
            db.exec(schema);
        } catch (e) {
            Logger.error('database::execSchema', e as Error);
        }
    } else {
        Logger.warn(`FATAL: Database schema file "${schemaFile}" not found!`);
        process.exit(1);
    }
}

class Database {
    private options = {};

    public db: Sqlite.Database;

    public memDb: Sqlite.Database;

    public constructor() {
        if (!existsSync(`./${process.env.DB_FILE}`)) {
            Logger.log("Couldn't find an existing database file, creating a new one!");
        }
        if (process.env.NODE_ENV === 'dev') {
            this.options = { verbose: console.log };
        }
        this.db = new Sqlite(`./${process.env.DB_FILE}`, this.options);
        this.memDb = new Sqlite(':memory:', this.options);
        this.db.pragma('journal_mode = WAL');
        execScema(this.db, './schema.sql');
        execScema(this.memDb, './inmemory_schema.sql');
    }
}

export const { db, memDb } = new Database();
