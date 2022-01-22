// TODO: Add Color

export class Logger {
    private static timeStamp(): string {
        const time = new Date();
        return `[${time.toLocaleString()}]:`;
    }

    public static log(message: string): void {
        const time = this.timeStamp();
        console.log(`${time} LOG: ${message}`);
    }

    public static warn(message: string, error?: Error): void {
        const time = this.timeStamp();
        if (error) {
            console.log(`${time} WARN: ${message}\n${error.message}\n------${error.stack}`);
            return;
        }
        console.log(`${time} WARN: ${message}`);
    }

    public static error(message: string, error: Error): void {
        const time = this.timeStamp();
        console.error(`${time} ${message} ERROR:\n${error.message}\n------${error.stack}`);
    }
}
