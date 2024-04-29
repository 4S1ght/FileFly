// Imports ====================================================================

import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import url from 'url'
import c from 'chalk'
import z, { object, string, number, boolean, literal, union } from 'zod'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Types ======================================================================

const ZConfig = object({
    // Security
    use_https: boolean(),
    ssl_source_type: union([
        literal('self-signed-'),
        literal('external')
    ]),
    ssl_external_cert: string().optional(),
    ssl_external_pkey: string().optional(),
})

type TConfig = z.infer<typeof ZConfig>

// Code =======================================================================

export default class Config {

    public static declare $: TConfig
    public static yamlFile = path.join(__dirname, '../../../../server.yaml')

    public static async load() {
        try {

            const text = await fs.readFile(this.yamlFile, 'utf-8')
            const config = yaml.load(text) as TConfig
            const parseResult = ZConfig.safeParse(config)
            this.$ = config

            if (!parseResult.error) return
            throw parseResult.error.issues.map(x => {
                return `<${x.path}> (${x.code}) Message: ${x.message}`
            })

        } 
        catch (error) {
            throw new this.ConfigParseError(error)
        }
    }

    private static ConfigParseError = class ConfigParseError extends Error {

        public configurationFile = Config.yamlFile

        constructor(parseErrors: any) {
            super()
            this.name = c.red(this.constructor.name)
            this.message = c.red(`An error was encountered while parsing server configuration.`)
            Error.captureStackTrace(this)

            if (Array.isArray(parseErrors)) {
                this.message += '\n    > ' +
                    parseErrors.map(x => c.yellow(x))
                    .join('\n')
                    + '\n'
            }

        }
        
    }

}