# 🔮 Vibe Scraping

*do you even scrape, brah?*

Welcome to Vibe Scraping, a quick-and-dirty tool thrown together while my students were taking their midterm.

1. Grabs a subreddit of your choice 
2. Pulls the top 5 posts
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

# Run with default subreddit (r/news)
node index.js

# Or specify a subreddit (e.g., r/programming)
node index.js programming
```

## 🗂️ Output Structure

```
output/
  └── TIMESTAMP/                    # Timestamp because version control is for the weak
      └── SUBREDDIT/                # Whatever subreddit you're analyzing
          ├── screenshots/          # Pictures, because reading is hard
          ├── page.html             # Raw HTML in case you need it (you won't)
          ├── posts.json            # Data for all scraped posts
          └── post_1_keyword_phrase/# Each post gets its own home with an AI-generated name
              ├── metadata.json     # Post details that might be useful someday (narrator: they weren't)
              ├── post.html         # More HTML you'll never look at
              ├── comments.json     # What people are actually fighting about
              ├── analysis.txt      # What GPT-4.1 thinks people are fighting about
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