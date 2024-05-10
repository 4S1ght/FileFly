// Imports ====================================================================

import path from 'path'
import url from 'url'
import c from 'chalk'
import winston from 'winston'
import 'winston-daily-rotate-file'

import Config from '../config/config.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

// Code =======================================================================

export default new class Logger {

    private declare winston: winston.Logger

    private labels: Record<string, string> = {
        crit:   'CRIT',
        error:  'ERRO',
        warn:   'WARN',
        notice: 'NOTE',
        info:   'INFO',
        http:   'HTTP',
        debug:  'DEBG'
    }

    private labelsColored: Record<string, string> = {
        crit:   c.red('CRIT'),
        error:  c.red('ERRO'),
        warn:   c.yellow('WARN'), 
        notice: c.cyan('NOTE'),
        info:   c.white('INFO'),
        http:   c.blue('HTTP'),
        debug:  c.magenta('DEBG')
    }

    private criticalLevels: Record<string, true> = {
        crit: true, error: true
    }

    private formats = {
        console: winston.format.printf(x => {
            return `${c.grey(x.timestamp)} ${this.labelsColored[x.level]} ${c.grey("["+x["0"]+"]")} ${this.criticalLevels[x.level] ? c.red(x.message) : x.message}`
        }),
        file: winston.format.printf(x => {
            return `${x.timestamp} ${this.labels[x.level]} [${x["0"]}] ${x.message}`.replace(/\x1B\[\d+m/g, '')
        })
    }
    
    public async init(): EavSingleAsync {
        try {
            this.winston = winston.createLogger({
                levels: {
                    crit:   0,
                    error:  1,
                    warn:   2,
                    notice: 3,
                    info:   4,
                    http:   5,
                    debug:  6 
                },
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                transports: [
                    new winston.transports.Console({
                        format: this.formats.console,
                        level: Config.$.log_console_level
                    }),
                    new winston.transports.DailyRotateFile({
                        filename:       path.join(__dirname, "../../../logs/%DATE%.log"),
                        auditFile:      path.join(__dirname, "../../../logs/audit.json"),
                        datePattern:    'YYYY-MM-DD',
                        format:         this.formats.file,
                        level:          Config.$.log_file_level,
                        maxSize:        Config.$.log_file_size,
                        maxFiles:       Config.$.log_files,
                        zippedArchive:  true,
                        createSymlink:  true,
                        symlinkName:    'latest.log'
                    })
                ]
            })
        } 
        catch (error) {
            return error as Error
        }
    }

    public getScope(scope: string) {

        const relativeScope =  url.fileURLToPath(scope)
            .replace(path.join(__dirname, '../'), '')
            .replace(/\\|\//g, '/')

        const mapMessage = (message: (string|object)[]) => message.map(x => {
            if (x instanceof Error) return `${x.message} \n${x.stack}`
            if (typeof x === 'object') return JSON.stringify(x)
            return x
        }).join(' ')

        return {
            CRIT:   (...message: (string|object|Error)[]) => this.winston.crit(mapMessage(message), [relativeScope]),
            ERROR:  (...message: (string|object|Error)[]) => this.winston.error(mapMessage(message), [relativeScope]),
            WARN:   (...message: (string|object|Error)[]) => this.winston.warn(mapMessage(message), [relativeScope]),
            NOTICE: (...message: (string|object|Error)[]) => this.winston.notice(mapMessage(message), [relativeScope]),
            INFO:   (...message: (string|object|Error)[]) => this.winston.info(mapMessage(message), [relativeScope]),
            HTTP:   (...message: (string|object|Error)[]) => this.winston.http(mapMessage(message), [relativeScope]),
            DEBUG:  (...message: (string|object|Error)[]) => this.winston.debug(mapMessage(message), [relativeScope]),
        }

    }

}