/* eslint-disable no-constant-condition */
import { test, expect } from 'vitest'
import puppeteer from 'puppeteer';

const startPuppeteer = async (url) => {
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    return { page, browser }
}

const refs = {}
beforeAll(async () => {
    const puppeteerRefs = await startPuppeteer()
    Object.assign(refs, puppeteerRefs)
})

afterAll(async () => {
    await refs.browser.close()
})

const testUrl = `http://localhost:4200/?p=/nwb&dandisetId=213569&dandisetVersion=draft&staging=1&url=https://api-staging.dandiarchive.org/api/assets/9b372ad4-a3f8-4d95-bda7-dc56637c8873/download/&st=lindi&tab=view:Autocorrelograms|/units`
// const testUrl = `http://localhost:4200`


test('End to end test', async () => {
    const { page } = refs
    await page.goto(testUrl)
    const countElements = async () => (await page.evaluate(() => {
        // This gets stringified and run in the browserS
        const nElements = document.querySelectorAll('*').length
        return {
            numElements: nElements,
            // eslint-disable-next-line no-undef
            errors: globalThis.testErrors
        }
    }))

    const expectedMinNumElements = 50

    let lastNumElements = 0
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 2500))
        const { numElements, errors } = await countElements()
        console.info('Errors:', errors)
        console.info('Number of elements:', numElements)
        // if (numElements >= expectedMinNumElements) {
        //     break
        // }
        if (numElements === lastNumElements) {
            break
        }
        lastNumElements = numElements
    }

    const {numElements, errors} = await countElements()
    console.info('Errors:', errors)
    expect(numElements).toBeGreaterThanOrEqual(expectedMinNumElements)
}, 60000)