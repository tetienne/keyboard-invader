import '@fontsource/fredoka/latin-400.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import './ui/styles.css'
import { App } from './ui/app'
import { titleScreen } from './ui/screens/title'

const canvas = document.getElementById('stage')
const root = document.getElementById('ui')
if (!(canvas instanceof HTMLCanvasElement) || !root) throw new Error('Missing #stage or #ui')

const app = new App(canvas, root)
app.go(titleScreen(app))
// Canvas text needs the web font: warm it up so the first letters render right.
void document.fonts.load('700 40px Fredoka')
