// Imports ====================================================================

import fs from 'fs/promises'
import path from 'path'
import url from 'url'
import c from 'chalk'
import Config from '../../config/config.js'
import generateX509Cert, { X509Options } from './x509.js'
import Logger from '../../logging/logging.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const out = Logger.getScope(import.meta.url)

// Types ======================================================================

// Code =======================================================================

export default new class SSL {

    private declare certRegenInterval: number
    private declare certRegenThreshold: number

    private sslFolder   = path.join(__dirname, '../../../../crypto/')
    private timestamp   = path.join(this.sslFolder, '.timestamp')
    private certPem     = path.join(this.sslFolder, 'cert.pem')
    private pratekeyPem = path.join(this.sslFolder, 'privatekey.pem')

    public async init() {

        out.DEBUG(`SSL init`)
        out.DEBUG(`SSL dir: ${this.sslFolder}`)

        this.certRegenInterval = 1 // days
        this.certRegenThreshold = 10 // days

        await fs.mkdir(this.sslFolder, { recursive: true })

        // Check .timestamp file and generate a new self-signed SSL certificate
        // if the old one is not there, is outdated or is near the end of its lifespan
        const generate = async () => {
            if (await this.shouldRegenerateCert()) {
                const timestamp = await this.getTimestamp()
                out.DEBUG(
                    `Cert.init > timestamp valid until ${c.blue(timestamp ? new Date(timestamp) : "N/A")} ` +
                    `(${timestamp ? ('~'+((timestamp - Date.now()) / 86400000).toFixed(2)) : 0} days)`
                )
                await this.generateSSLCert()
            }
        }

        // Initialize certificate and check it periodically
        if (Config.$.ssl_source_type === 'self-signed' && Config.$.use_https) {
            await generate()
            setInterval(() => generate(), this.certRegenInterval * 1000*60*60*24)
        }

    }

    public async generateSSLCert(): EavSingleAsync {
        try {

            const config: X509Options = {
                days: Config.$.ssl_lifetime_days,
                alg: Config.$.ssl_alg,
                keySize: Config.$.ssl_key_size,
                commonName: Config.$.ssl_common_name,
                countryName: Config.$.ssl_country_name,
                localityName: Config.$.ssl_locality_name,
                organizationName: Config.$.ssl_organization_name
            }

            out.WARN('Cert.generateSSLCert getting new ssl cert/key pair')
            out.DEBUG(`Cert.generateSSLCert config`, JSON.stringify(config))

            const ssl = await generateX509Cert(config)

            out.DEBUG(`Cert.generateSSLCert writing SSL cert - ${c.blue(this.certPem)}`)
            await fs.writeFile(this.certPem, ssl.cert)

            out.DEBUG(`Cert.generateSSLCert writing private key - ${c.blue(this.pratekeyPem)}`)
            await fs.writeFile(this.pratekeyPem, ssl.privateKey)
            
            // Update .timestamp file
            const validUntil = await this.setTimestamp()

            out.NOTICE('Cert.generateSSLCert finished successfully')
            out.NOTICE(`New SSL certificate valid until ${c.blue(new Date(validUntil))}. Alg: ${config.alg}, key size: ${config.keySize}.`)
            
        } 
        catch (error) {
            return error as Error
        }
    }

    public async getSSLCertKeyData(): EavAsync<{ cert: string, key: string }> {
        try {
            if (Config.$.ssl_source_type === 'external') {
                out.INFO('Using external SSL certificate')
                return [undefined, {
                    cert: await fs.readFile(Config.$.ssl_external_cert!, 'utf-8'),
                    key: await fs.readFile(Config.$.ssl_external_cert!, 'utf-8')
                }]
            }
            else {
                out.WARN('Using self-signed SSL certificate')
                return [undefined, {
                    cert: await fs.readFile(this.certPem, 'utf-8'),
                    key: await fs.readFile(this.pratekeyPem, 'utf-8')
                }]
            }
        } 
        catch (error) {
            return [error as Error, undefined]
        }
    }

    // Utilities ==============================================================

    private async shouldRegenerateCert() {
        if (Config.$.ssl_source_type === 'self-signed') {
            const timestamp = await this.getTimestamp()
            // No .timestamp = no SSL certificate
            if (timestamp === undefined) return true
            // .timestamp expired or soon to expire
            if ((timestamp - Date.now()) < (this.certRegenInterval * 24*60*60*1000)) return true
            // Within expire threshold
            return false
        }
        else {
            return false
        }
    }

    private async getTimestamp() {
        try {
            const content = await fs.readFile(this.timestamp, 'utf-8')
            return parseInt(content)
        }
        catch (error) {
            return undefined
        }
    }

    private async setTimestamp() {
        const now = Date.now() + Config.$.ssl_lifetime_days * 1000 * 60 * 60 * 24
        await fs.writeFile(this.timestamp, now.toString())
        return now
    }

}

