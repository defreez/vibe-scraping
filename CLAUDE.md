# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Scraping is a tool for scraping Reddit posts, extracting article content from linked pages, and analyzing both the article and user comments using OpenAI GPT models. It:

1. Grabs a specified subreddit (default: r/news)
2. Pulls the top 5 posts
3. Extracts posts, comments, and screenshots of external links
4. Uses GPT models to extract text and analyze comments in conjunction with articles

## Commands

### Run the scraper

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your_api_key_here

# Run with default subreddit (r/artificial)
npm run start

# Or specify a subreddit (e.g., r/programming)
node index.js programming
```

## Architecture

The project uses:

- **Puppeteer** for web scraping and taking screenshots
- **Sharp** for image processing (splitting large screenshots into manageable chunks)
- **OpenAI API** for analyzing screenshots and generating insights

The main workflow:

1. **Main Page Scraping**: Uses Puppeteer to navigate to the specified subreddit
2. **Post Extraction**: Scrapes top 5 posts and their metadata
3. **Comment Collection**: Extracts comments from each post
4. **External Link Processing**: For link posts, follows external links and takes screenshots
5. **Image Analysis**: Uses GPT-4.1-mini to extract article text from screenshots
6. **Content Analysis**: Uses GPT-4.1 to analyze the article and comments together

**Important note**: The tool is designed to analyze all types of Reddit posts:
1. For all posts, it captures a screenshot of the post page and includes the top portion (resized to 768px width) in the analysis
2. For link posts, it follows the external link and extracts article text using GPT-4.1-mini
3. For image posts, it includes the post screenshot in the analysis for direct image interpretation by GPT-4.1
4. If external links fail, it still proceeds with analysis using the post screenshot and comments
5. Has robust error handling for each step to ensure analysis completes for all post types

Output is organized by timestamp and subreddit, with each post getting its own directory named with an AI-generated keyword phrase.

## Key Components

- **Image Splitting**: `splitImageIntoChunks()` breaks large screenshots into smaller chunks for GPT models
- **Comment Extraction**: `extractComments()` pulls comments from Reddit posts
- **Article Analysis**: `analyzeArticleAndComments()` uses GPT-4.1 to analyze content and sentiment
- **Error Handling**: The code includes robust error handling to continue analysis even when external links fail