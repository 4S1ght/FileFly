// Global CSS =================================================================

import './app.scss'

// Fontawesome Icons ==========================================================

import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)
dom.watch()

// APp ========================================================================

// @ts-ignore - Type declaration issues. Yey.
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app
