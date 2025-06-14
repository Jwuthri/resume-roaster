import puppeteer from 'puppeteer'

export interface ScreenshotOptions {
  width?: number
  height?: number
  format?: 'png' | 'jpeg'
  quality?: number
  fullPage?: boolean
}

/**
 * Generate a screenshot of HTML content and return as base64
 */
export async function generateHTMLScreenshot(
  htmlContent: string,
  options: ScreenshotOptions = {}
): Promise<string> {
  const {
    width = 794, // A4 width in pixels at 96 DPI
    height = 1123, // A4 height in pixels at 96 DPI
    format = 'png',
    quality = 90,
    fullPage = true
  } = options

  let browser
  try {
    // Launch browser in headless mode
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // Set viewport to A4 size
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1
    })

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    // Add CSS to ensure proper rendering
    await page.addStyleTag({
      content: `
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          color: #333;
          line-height: 1.5;
        }
        * {
          box-sizing: border-box;
        }
        @media print {
          body { margin: 0; padding: 20px; }
        }
      `
    })

    // Wait a bit for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      type: format,
      quality: format === 'jpeg' ? quality : undefined,
      fullPage,
      omitBackground: false
    })

    // Convert to base64
    return Buffer.from(screenshotBuffer).toString('base64')

  } catch (error) {
    console.error('Error generating HTML screenshot:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to generate screenshot: ${errorMessage}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Generate multiple screenshots for paginated content
 */
export async function generatePaginatedScreenshots(
  htmlContent: string,
  options: ScreenshotOptions = {}
): Promise<string[]> {
  const {
    width = 794,
    height = 1123,
    format = 'png',
    quality = 90
  } = options

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // Set viewport to A4 size
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1
    })

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    // Add CSS for proper pagination
    await page.addStyleTag({
      content: `
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          color: #333;
          line-height: 1.5;
        }
        * {
          box-sizing: border-box;
        }
        @page {
          size: A4;
          margin: 0.5in;
        }
        @media print {
          body { margin: 0; padding: 20px; }
        }
      `
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Get the total height of the content
    const contentHeight = await page.evaluate(() => {
      return document.body.scrollHeight
    })

    const screenshots: string[] = []
    const pageHeight = height - 40 // Account for padding
    const totalPages = Math.ceil(contentHeight / pageHeight)

    // Generate screenshots for each "page"
    for (let i = 0; i < totalPages; i++) {
      const yOffset = i * pageHeight

      // Scroll to the current page position
      await page.evaluate((offset) => {
        window.scrollTo(0, offset)
      }, yOffset)

      await new Promise(resolve => setTimeout(resolve, 500))

      // Take screenshot of current viewport
      const screenshotBuffer = await page.screenshot({
        type: format,
        quality: format === 'jpeg' ? quality : undefined,
        fullPage: false,
        omitBackground: false,
        clip: {
          x: 0,
          y: 0,
          width,
          height
        }
      })

      screenshots.push(Buffer.from(screenshotBuffer).toString('base64'))
    }

    return screenshots

  } catch (error) {
    console.error('Error generating paginated screenshots:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to generate paginated screenshots: ${errorMessage}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
} 