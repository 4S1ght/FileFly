// Imports ====================================================================

import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import url from 'url'
import c from 'chalk'
import z, { object, string, number, boolean, literal, union } from 'zod'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Types ======================================================================

const ZLogLevel = union([
    literal('crit'),
    literal('error'),
    literal('warn'),
    literal('notice'),
    literal('info'),
    literal('http'),
    literal('debug')
])

const ZConfig = object({
    // Security
    use_https: boolean(),
    http_port: number(),
    ssl_source_type: union([
        literal('self-signed'),
        literal('external')
    ]),
    ssl_external_cert: string().optional(),
    ssl_external_pkey: string().optional(),
    ssl_lifetime_days: number(),
    ssl_alg: union([
        literal('sha256'),
        literal('sha384'),
        literal('sha512')
    ]),
    ssl_key_size: number(),
    ssl_common_name: string(),
    ssl_country_name: string(),
    ssl_locality_name: string(),
    ssl_organization_name: string(),
    bcrypt_password_salt_rounds: number(),
    // Logging
    log_console_level: ZLogLevel,
    log_file_level: ZLogLevel,
    log_file_size: union([ number(), string() ]),
    log_files: union([ number(), string() ]),
})

type TConfig = z.infer<typeof ZConfig>

// Code =======================================================================

export default class Config {

    public static declare $: TConfig
    public static yamlFile = path.join(__dirname, '../../../../server.yaml')

    public static async load(): EavSingleAsync<ConfigParseError> {
        try {

            const text = await fs.readFile(this.yamlFile, 'utf-8')
            const config = yaml.load(text) as TConfig
            const parseResult = ZConfig.safeParse(config)
            this.$ = config

            if (!parseResult.error) return;

            throw parseResult.error.issues.map(x => {
                return `<${x.path}> (${x.code}) Error: ${x.message}`
            })

        } 
        catch (error) {
            return new ConfigParseError(error) 
        }
    }
}
class ConfigParseError extends Error {

    public configurationFile = Config.yamlFile

    constructor(parseError: any) {
        super()
        this.name = c.red(this.constructor.name)
        this.message = parseError.message || c.red(`An error was encountered while parsing server configuration.`)
        Error.captureStackTrace(this)

        if (Array.isArray(parseError)) {
            this.message += '\n    > ' +
            parseError.map(x => c.yellow(x))
                .join('\n    > ')
        }

    }
    
}