'use server'

import Firecrawl, { ScrapeResponse } from "@mendable/firecrawl-js"

interface MapWebsiteResult {
    success: boolean
    links?: string[]
    error?: string
    message?: string
}

export async function mapWebsite(url: string): Promise<MapWebsiteResult> {
    try {
        // Validate URL format
        try {
            new URL(url)
        } catch {
            return {
                success: false,
                error: "Invalid URL format",
                message: "Please provide a valid URL (e.g., https://example.com)"
            }
        }

        // Check if API key is configured
        if (!process.env.FIRECRAWL_API_KEY) {
            console.error('FIRECRAWL_API_KEY environment variable is not set')
            return {
                success: false,
                error: "Configuration error",
                message: "Website scraping service is not configured. Please contact support."
            }
        }

        const firecrawl = new Firecrawl({
            apiKey: process.env.FIRECRAWL_API_KEY
        })
        
        const response = await firecrawl.mapUrl(url)
        console.log('Firecrawl response:', response)
        
        // Handle Firecrawl API errors
        if (!response) {
            return {
                success: false,
                error: "No response",
                message: "No response received from scraping service"
            }
        }

        if ('success' in response && !response.success) {
            return {
                success: false,
                error: response.error || "Scraping failed",
                message: response.error || "Failed to scrape the website. The site may be protected or unavailable."
            }
        }

        // Handle successful response
        if ('success' in response && response.success) {
            return {
                success: true,
                links: response.links || [],
                message: `Successfully mapped website${response.links?.length ? ` and found ${response.links.length} links` : ''}`
            }
        }

        // Fallback for unexpected response format
        return {
            success: false,
            error: "Unexpected response format",
            message: "Received unexpected response from scraping service"
        }

    } catch (error) {
        console.error('Error in mapWebsite:', error)
        
        // Handle specific error types
        if (error instanceof Error) {
            // Network/timeout errors
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                return {
                    success: false,
                    error: "Timeout error",
                    message: "The website took too long to respond. Please try again or try a different URL."
                }
            }
            
            // Network connectivity errors
            if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                return {
                    success: false,
                    error: "Connection error",
                    message: "Unable to connect to the website. Please check the URL and try again."
                }
            }

            // Rate limiting errors
            if (error.message.includes('429') || error.message.includes('rate limit')) {
                return {
                    success: false,
                    error: "Rate limit exceeded",
                    message: "Too many requests. Please wait a moment before trying again."
                }
            }

            // Authentication errors
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                return {
                    success: false,
                    error: "Authentication error",
                    message: "Scraping service authentication failed. Please contact support."
                }
            }

            // Generic error with message
            return {
                success: false,
                error: "Scraping error",
                message: `Failed to scrape website: ${error.message}`
            }
        }

        // Unknown error
        return {
            success: false,
            error: "Unknown error",
            message: "An unexpected error occurred while scraping the website"
        }
    }
}

export async function scrapeWebsite(url: string) {

    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: url,
            formats: ['markdown']
        })
    })
    const data = await response.json()

    // check for data.success, if yes, return data.data.markdown

    if (data.success) {
        return {
            success: true,
            content: data.data.markdown
        }
    } else {
        return {
            success: false,
            error: data.error,
            message: data.message
        }
    }

}
