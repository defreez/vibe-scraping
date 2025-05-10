# Vibe Scraping

This is Vibe Scraping. It's a hobby Reddit link scraper I started 
making while my OS students were taking a midterm. Its primary purpose was to demonstrate that web scraping is a fun and easy 
target for vibe coding. For that reason we scrape reddit.com directly instead old.reddit.com. 

Thea idea of vibe scraping is that writing traditional scrapers is an unpleasant and fragile experience. However, computer vision has
come a long ways. So we just grab a screenshot, send it to GPT for
analysis, and move on. Most of the time it works, sometimes it doesn't, it's vibe scraping!

Perfect for all of your "Market research"

## 📋 Prerequisites

You'll need:

- Node.js
- An OpenAI API key 

## 🛠️ Installation

```bash
# Clone this repository
git clone https://github.com/defreez/vibe-scraping.git

# Navigate to the project directory
cd vibe-scraping

# Install dependencies
npm install

# Install globally (optional, for CLI commands)
npm install -g .
```

## 🚀 Usage

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your_api_key_here

# Get help with command-line options
vibe-scrape --help

# Basic usage (requires at least one subreddit)
vibe-scrape programming

# Specify multiple subreddits
vibe-scrape programming worldnews technology
```

## 📊 Report Types

Two report types are available with vibe-report, each with unique focus and style:

1. **Newsletter** (default) - General information digest with key highlights and summaries
2. **Academic** - Literature review format for more formal analysis

Report types are selected when generating reports, not during scraping:
```bash
# Generate newsletter style report (default)
vibe-report ./data/raw/20250508_123456

# Generate academic style report
vibe-report ./data/raw/20250508_123456 --type academic
```

## 🔍 Analyzing Existing Data

You can generate reports from previously scraped content:

```bash
# Get help with command-line options
vibe-report --help

# Basic usage (requires raw data directory path)
vibe-report ./data/raw/TIMESTAMP_DIRECTORY

# Using npm run script
npm run report -- ./data/raw/TIMESTAMP_DIRECTORY

# Generate a specific report type from existing data
vibe-report ./data/raw/TIMESTAMP_DIRECTORY --type academic

# Add recipient name for personalized reports
vibe-report ./data/raw/TIMESTAMP_DIRECTORY --recipient "Charlie"

# Combine options
vibe-report ./data/raw/TIMESTAMP_DIRECTORY --type academic --recipient "Charlie"
```

## 🗂️ Project Structure

```
/
├── bin/                  # Executable CLI scripts
│   ├── vibe-scrape       # Main scraping command
│   └── vibe-report       # Report generation command for existing data
├── src/                  # Source code
│   ├── scrape.js         # Scraping functionality
│   ├── analyze.js        # Analysis functionality
│   └── reports.js        # Report type configurations
├── data/                 # Data directories
│   ├── raw/              # Raw scraped data (gitignored)
│   └── reports/          # Generated reports (gitignored)
```

## 📦 Output Structure

```
data/
  ├── raw/                                # Raw scraped data
  │   └── TIMESTAMP/                      # Run timestamp
  │       └── SUBREDDIT/                  # Each subreddit gets a directory
  │           ├── main_page.png           # Screenshot of the subreddit's main page
  │           ├── page.html               # HTML content of the subreddit's main page
  │           └── post_#_keyword_phrase/  # Each post gets its own directory
  │               ├── metadata.json       # Post metadata
  │               ├── comments.json       # Extracted comments
  │               ├── analysis.md         # AI analysis of post and comments
  │               ├── post.png            # Reddit post screenshot
  │               ├── external.png        # External link screenshot (if applicable)
  │               ├── external.html       # External link HTML (if applicable)
  │               └── article.txt         # Extracted article text (if applicable)
  │
  └── reports/                            # Generated reports
      └── TIMESTAMP/                      # Run timestamp (matches raw data)
          ├── combined_report-type_name.md # Combined report across subreddits
          ├── subreddit_analysis.md       # Analysis of all posts
          └── subreddit_report-type_name.md # Subreddit-specific report
```

## ⚙️ Configuration

### Basic Settings

Edit these constants in `src/scrape.js` to customize:

```javascript
// Constants
const IMAGE_MODEL = 'gpt-4.1-mini';  // For extracting article text
const ANALYSIS_MODEL = 'gpt-4.1';    // For deeper analysis
const SUMMARY_MODEL = 'gpt-4.1';     // For generating folder names
const POSTS_PER_SUBREDDIT = 3;  // Default number of posts to scrape per subreddit
```

You can also override settings with command-line options:

```bash
# Override posts per subreddit (default is 3)
vibe-scrape --num-posts 10 programming
```

### Custom Report Types

Add new report types in `src/reports.js`:

```javascript
// 1. Add a new key to REPORT_TYPES
const REPORT_TYPES = {
  newsletter: "newsletter",
  academic: "academic",
  custom: "custom" // Add your new type here
};

// 2. Create a configuration object for your type
const customConfig = {
  name: "Custom Report",
  description: "Your custom report description",
  
  // Required templates
  newsletterIntro: `...`,
  subredditAnalysisPrompt: `...`,
  combinedNewsletterPrompt: `...`,
  newsletterItemPrompt: `...`,
  combinedNewsletterFooter: `...`
};

// 3. Add it to the reportConfigs map
const reportConfigs = {
  [REPORT_TYPES.newsletter]: newsletterConfig,
  [REPORT_TYPES.academic]: academicConfig,
  [REPORT_TYPES.custom]: customConfig
};
```

## 📜 License

MIT - Feel free to build your own weird internet scraping tools.