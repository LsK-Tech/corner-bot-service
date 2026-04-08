import 'dotenv/config'

import * as Sentry from '@sentry/node'
import cron from 'node-cron'

import { postGameCompact } from '../infra-api/apiClient'
import { CornerBetService } from '../dominio/cornerBetService'
import { LoggerService } from '../infra-log/loggerService'

const logger = new LoggerService('corner-bet-service')

const CRON_RULE = '0 6,12,14,20 * * *'

function initSentry(): void {
    const dsn = process.env.SENTRY_DSN
    if (dsn) {
        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV ?? 'production'
        })
        logger.log('Sentry inicializado.')
    }
}

async function runGetGameCompactDataJob(): Promise<void> {
    if (!process.env.CORNER_BET_USERNAME || !process.env.CORNER_BET_PASSWORD) {
        const err = new Error(
            'CORNER_BET_USERNAME e CORNER_BET_PASSWORD são obrigatórios.'
        )
        logger.error(err.message)
        captureException(err)
        return
    }

    const service = new CornerBetService()
    const { data, exception } = await service.getGameCompactData()

    if (exception != null) {
        logger.error('getGameCompactData falhou:', exception)
        captureException(exception)
        return
    }

    if (data != null) {
        try {
            await postGameCompact(data)
            logger.log('Dados enviados para GAME_COMPACT_API_URL com sucesso.')
        } catch (err) {
            logger.error('Falha ao enviar dados para a API:', err as Error)
            captureException(err)
        }
    }
}

function captureException(err: unknown): void {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(err)
    }
}

async function main(): Promise<void> {
    initSentry()

    const tz = process.env.TZ ?? 'UTC'
    logger.log(
        `Execução inicial ao subir o processo; em seguida o cron ${CRON_RULE} (timezone=${tz}).`
    )
    await runGetGameCompactDataJob()

    logger.log(`Agendando getGameCompactDataJob: ${CRON_RULE} (timezone=${tz})`)
    cron.schedule(
        CRON_RULE,
        () => {
            void runGetGameCompactDataJob()
        },
        { timezone: tz }
    )

    logger.log('Microsserviço corner-bet em execução (aguardando próximas janelas do cron).')
}

void main().catch((err: unknown) => {
    logger.error('Falha no fluxo principal (inicialização ou setup do cron):', err as Error)
    captureException(err)
    process.exit(1)
})
