# 🔮 Vibe Scraping

<img src="logo.png" alt="Vibe Scraping Logo" width="300"/>

This is Vibe Scraping.

## What is Web Scraping?

Web scraping is the automated process of extracting data from websites. It involves programmatically accessing web pages, parsing their content, and collecting specific information in a structured format for analysis, storage, or other purposes.

## What This Tool Does

Vibe Scraping is a comprehensive web content analysis tool that:

1. **Automated Content Collection**: Uses Puppeteer (headless Chrome browser) to navigate to Reddit subreddits and follow links
2. **DOM Interaction**: Extracts structured data from Reddit's custom web components (post titles, comments, permalinks)
3. **Full-Page Capturing**: Takes high-quality screenshots of Reddit posts and external linked articles
4. **Multi-level Extraction**:
   - Grabs subreddits of your choice
   - Pulls the top posts from each subreddit
   - Extracts post metadata, comments, and user interactions
   - Follows external links to capture original source content
5. **Visual Processing**: Uses GPT-4.1 to analyze screenshots and extract text from images
6. **Content Analysis**: Processes text and visual content to generate meaningful insights
7. **Report Generation**: Creates structured, categorized reports based on configured templates

Unlike simple HTTP scrapers that just download HTML, this tool simulates full browser interactions, handles JavaScript-rendered content, and processes visual elements - creating a complete picture of online discussions.

Perfect for "Market research"

For developers, the architecture demonstrates:
- Headless browser automation with Puppeteer
- Web content extraction from modern single-page applications
- Integration of AI/ML for content analysis
- Modular template system for customizable outputs
- Parallel processing of multiple content sources 

## 📋 Prerequisites

You'll need:

- Node.js
- An OpenAI API key 

## 🛠️ Installation

```bash
# Clone this repository (or download it, I'm not your boss)
git clone https://github.com/defreez/vibe-scraping.git

# Navigate to the project directory
cd vibe-scraping

# Install dependencies (pray that nothing breaks)
npm install
```

## 🚀 Usage

```bash
# Set your API key (don't commit this to GitHub unless you like surprise AWS bills)
export OPENAI_API_KEY=your_actual_key_here

# Basic usage with default settings (newsletter report type)
node index.js --recipient "Alice Smith"

# Specify a report type (newsletter, market, or academic)
node index.js --type market --recipient "Bob Jones"

# Recipient is optional - without recipient, uses "Hey there" as greeting
node index.js --type academic programming

# Specify multiple subreddits (defaults: r/news, r/ashland)
node index.js --recipient "Charlie Brown" --type newsletter programming

# Scrape multiple specific subreddits
node index.js --type market worldnews politics technology

# Order of flags doesn't matter
node index.js worldnews politics --recipient "Dana Smith" --type academic
```

## 📊 Additional Analysis

The script automatically generates hierarchical analyses:
1. Individual post analysis (analysis.md in each post directory)
2. Subreddit-level analysis (subreddit_analysis.md in each subreddit directory)
3. Combined report across all subreddits (combined_report_type_name.md in the root output directory)

### Report Types

Three report types are available, each with unique focus and style:

1. **Newsletter** (default) - General information digest with key highlights and summaries
2. **Market** - Business-focused analysis with market trends, consumer insights, and competitive intelligence
3. **Academic** - Scholarly analysis with research implications, methodological considerations, and theoretical frameworks

You can also run additional analysis on existing output directories:

```bash
# Process additional analyses on an existing run directory
node analyze.js ./output/TIMESTAMP_DIRECTORY --recipient "Bob Jones"

# Generate a different report type from existing data
node analyze.js ./output/TIMESTAMP_DIRECTORY --type market

# Combine flags as needed
node analyze.js ./output/TIMESTAMP_DIRECTORY --type academic --recipient "Charlie Brown"
```

## 🗂️ Output Structure

```
output/
  └── TIMESTAMP/                    # Timestamp because version control is for the weak
      ├── combined_subreddits_newsletter.md # Combined newsletter for all subreddits
      └── SUBREDDIT/                # Whatever subreddit you're analyzing
          ├── screenshots/          # Pictures, because reading is hard
          ├── page.html             # Raw HTML in case you need it (you won't)
          ├── posts.json            # Data for all scraped posts
          ├── subreddit_analysis.md # Comprehensive analysis of all posts in the subreddit
          ├── SUBREDDIT_newsletter.md # Single subreddit newsletter
          └── post_1_keyword_phrase/# Each post gets its own home with an AI-generated name
              ├── metadata.json     # Post details that might be useful someday (narrator: they weren't)
              ├── post.html         # More HTML you'll never look at
              ├── comments.json     # What people are actually fighting about
              ├── analysis.md       # What GPT-4.1 thinks about this post (in markdown!)
              ├── screenshots/      # More pictures!
              │   ├── post.png      # Reddit post screenshot
              │   └── external.png  # External article screenshot
              └── external/         # For links to news sites and such
                  ├── external.html # Even more HTML you'll never read
                  └── article.txt   # The article text, finally
```

## ⚙️ Configuration

### Basic Settings

Edit these constants in `index.js` to customize:

```javascript
// Constants
const USER_AGENT = '...';  // Change if you want to pretend to be a different browser
const IMAGE_MODEL = 'gpt-4.1-mini';  // For extracting article text
const ANALYSIS_MODEL = 'gpt-4.1';    // For deeper analysis
const SUMMARY_MODEL = 'gpt-4.1';     // For generating folder names
const DEFAULT_SUBREDDITS = ['news', 'ashland'];  // Default subreddits to scrape
```

### Custom Report Types

Add or modify report types in `reports.js`:

```javascript
// To add a new report type:
1. Add a new key to REPORT_TYPES
2. Create a config object with templates and prompts
3. Add it to the reportConfigs map

// Example:
const customConfig = {
  name: "Custom Report",
  description: "Your custom report description",

  // Templates (see existing types for structure)
  newsletterIntro: `...`,
  subredditAnalysisPrompt: `...`,
  combinedNewsletterPrompt: `...`,
  newsletterItemPrompt: `...`,
  combinedNewsletterFooter: `...`
};

// Add to report configs
const reportConfigs = {
  [REPORT_TYPES.newsletter]: newsletterConfig,
  [REPORT_TYPES.market]: marketConfig,
  [REPORT_TYPES.academic]: academicConfig,
  [REPORT_TYPES.custom]: customConfig  // Add your new type here
};
```

## 📜 License

MIT - Feel free to build your own weird internet scraping tools.