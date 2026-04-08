export class LoggerService {
    private prefix: string

    constructor(prefix: string) {
        this.prefix = prefix
    }

    log(message: string): void {
        console.log(`[${this.prefix}] ${message}`)
    }

    error(message: string, error?: Error): void {
        console.error(`[${this.prefix}] ${message}`, error ? error : '')
    }
}
