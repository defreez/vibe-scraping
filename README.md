# 🔮 Vibe Scraping

*do you even scrape, brah?*

Welcome to Vibe Scraping, a quick-and-dirty tool thrown together while my students were taking their midterm.

1. Grabs subreddits of your choice 
2. Pulls the top 10 posts from each
3. Extracts posts, comments, and screenshots of external links.
4. Uses GPT-4.1 to extract the text and analyze comments in conjunction with article.

Perfect for "Market research" 

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

# Recipient name is required for personalized newsletters
node index.js --recipient "Alice Smith"

# Use default subreddits (r/news, r/ashland) with recipient name
node index.js --recipient "Bob Jones"

# Specify one or more subreddits with recipient name
node index.js --recipient "Charlie Brown" programming

# Scrape multiple specific subreddits
node index.js --recipient "Dana Smith" worldnews politics technology
```

## 📊 Additional Analysis

The script automatically generates hierarchical analyses:
1. Individual post analysis (analysis.md in each post directory)
2. Subreddit-level analysis (subreddit_analysis.md in each subreddit directory)
3. Combined newsletter across all subreddits (security_newsletter_all.md in the root output directory)

You can also run additional analysis on existing output directories:

```bash
# Process additional analyses on an existing run directory (recipient name is required)
node analyze.js ./output/TIMESTAMP_DIRECTORY --recipient "Bob Jones"
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

Edit these constants in `index.js` to customize:

```javascript
// Constants
const USER_AGENT = '...';  // Change if you want to pretend to be a different browser
const IMAGE_MODEL = 'gpt-4.1-mini';  // For extracting article text
const ANALYSIS_MODEL = 'gpt-4.1';    // For deeper analysis
const SUMMARY_MODEL = 'gpt-4.1';     // For generating folder names
const DEFAULT_SUBREDDIT = 'artificial';  // Default subreddit to scrape
```

## 📜 License

MIT - Feel free to build your own weird internet scraping tools.