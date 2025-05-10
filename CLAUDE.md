# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Scraping is a tool for scraping Reddit posts, extracting article content from linked pages, and analyzing both the article and user comments using OpenAI GPT models. It:

1. Processes multiple subreddits (defaults: r/news, r/ashland)
2. Pulls the top posts from each subreddit
3. Extracts posts, comments, and screenshots of external links
4. Uses GPT models to extract text and analyze comments in conjunction with articles

## Project Structure

The project follows a standard Node.js CLI application structure:

```
/
├── bin/                  # Executable CLI scripts
│   ├── vibe-scrape       # Main scraping command
│   └── vibe-report       # Report generation command for existing data
├── src/                  # Source code
│   ├── scrape.js         # Main scraping functionality
│   ├── analyze.js        # Analysis functionality
│   └── reports.js        # Report type configurations
├── data/                 # Data directories
│   ├── raw/              # Raw scraped data (gitignored)
│   └── reports/          # Generated reports (gitignored)
└── package.json          # Project configuration
```

## Commands

### Run the scraper

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your_api_key_here

# Get command help
vibe-scrape --help

# Basic usage (requires at least one subreddit)
vibe-scrape programming

# Using npm scripts
npm run start -- worldnews politics

# Specify multiple subreddits
vibe-scrape programming worldnews

# Set the number of posts to scrape per subreddit
vibe-scrape --num-posts 5 programming
```

### Generate reports from existing data

```bash
# Get command help
vibe-report --help

# Generate reports from existing data (using default Newsletter format)
vibe-report ./data/raw/TIMESTAMP_DIRECTORY

# Using npm scripts
npm run report -- ./data/raw/TIMESTAMP_DIRECTORY

# Select different report type (Literature Review)
vibe-report ./data/raw/TIMESTAMP_DIRECTORY --type academic

# Customize recipient name
vibe-report ./data/raw/TIMESTAMP_DIRECTORY --recipient "John Doe"

# Combine options
vibe-report ./data/raw/TIMESTAMP_DIRECTORY --type academic --recipient "John Doe"
```

## Architecture

The project uses:

- **Puppeteer** for web scraping and taking screenshots
- **Sharp** for image processing (splitting large screenshots into manageable chunks)
- **OpenAI API** for analyzing screenshots and generating insights

The main workflow:

1. **Subreddit Processing**: Iterates through multiple subreddits sequentially
2. **Main Page Scraping**: Uses Puppeteer to navigate to each subreddit
3. **Post Extraction**: Scrapes top 10 posts and their metadata for each subreddit
4. **Comment Collection**: Extracts comments from each post
5. **External Link Processing**: For link posts, follows external links and takes screenshots
6. **Image Analysis**: Uses GPT-4.1-mini to extract article text from screenshots
7. **Content Analysis**: Uses GPT-4.1 to analyze the article and comments together

**Important note**: The tool is designed to analyze all types of Reddit posts:
1. For all posts, it captures a screenshot of the post page and includes the top portion (resized to 768px width) in the analysis
2. For link posts, it follows the external link and extracts article text using GPT-4.1-mini
3. For image posts, it includes the post screenshot in the analysis for direct image interpretation by GPT-4.1
4. If external links fail, it still proceeds with analysis using the post screenshot and comments
5. Has robust error handling for each step to ensure analysis completes for all post types

Output is organized by timestamp and subreddit, with each post getting its own directory named with an AI-generated keyword phrase. All files for a post (screenshots, HTML, text) are stored directly in its directory for simplified access.

## Key Components

- **Image Splitting**: `splitImageIntoChunks()` breaks large screenshots into smaller chunks for GPT models
- **Comment Extraction**: `extractComments()` pulls comments from Reddit posts
- **Article Analysis**: `analyzeArticleAndComments()` uses GPT-4.1 to analyze content and sentiment
- **Error Handling**: The code includes robust error handling to continue analysis even when external links fail