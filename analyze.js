/**
 * analyze.js - Additional analysis utilities for the vibe-scraping project
 * 
 * This module adds hierarchical analysis functionality to create:
 * 1. Individual post analysis (from index.js)
 * 2. Subreddit-level analysis (combining all posts)
 * 3. Combined newsletter across all subreddits
 */

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Initialize OpenAI client - will use environment variable OPENAI_API_KEY
const openai = new OpenAI();

// Constants
const ANALYSIS_MODEL = 'gpt-4.1';    // Model used for in-depth article/comment analysis
const SUMMARY_MODEL = 'gpt-4.1'; // Model used for quick one-word summaries

/**
 * Generate a security-focused subreddit analysis from individual post analyses
 * @param {string} subreddit - Name of the subreddit 
 * @param {string} runDir - Directory containing the run data
 * @returns {Promise<string>} Subreddit analysis content
 */
async function generateSubredditAnalysis(subreddit, runDir) {
  try {
    console.log(`Generating subreddit analysis for r/${subreddit}...`);
    
    // Get the subreddit directory
    const subredditDir = path.join(runDir, subreddit);
    
    // Check if directory exists
    if (!fs.existsSync(subredditDir)) {
      throw new Error(`Subreddit directory not found: ${subredditDir}`);
    }
    
    // Get all post directories
    const postDirs = fs.readdirSync(subredditDir)
      .filter(item => item.startsWith('post_') && 
              fs.statSync(path.join(subredditDir, item)).isDirectory());
    
    if (postDirs.length === 0) {
      throw new Error(`No post directories found in ${subredditDir}`);
    }
    
    // Collect all post analyses
    const postAnalyses = [];
    
    for (const postDir of postDirs) {
      const fullPostDir = path.join(subredditDir, postDir);
      
      // Get post metadata
      const metadataPath = path.join(fullPostDir, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        console.warn(`Metadata not found for ${postDir}, skipping`);
        continue;
      }
      
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Check for analysis file (either .txt or .md)
      let analysisText;
      const analysisTxtPath = path.join(fullPostDir, 'analysis.txt');
      const analysisMdPath = path.join(fullPostDir, 'analysis.md');

      if (fs.existsSync(analysisMdPath)) {
        // Analysis already exists in markdown format
        analysisText = fs.readFileSync(analysisMdPath, 'utf8');
        console.log(`Found existing analysis.md for ${postDir}`);
      } else if (fs.existsSync(analysisTxtPath)) {
        // Convert from txt to md
        analysisText = fs.readFileSync(analysisTxtPath, 'utf8');

        // Save as markdown
        fs.writeFileSync(analysisMdPath, analysisText);
        console.log(`Converted analysis.txt to analysis.md for ${postDir}`);

        // Delete the txt file
        fs.unlinkSync(analysisTxtPath);
        console.log(`Removed original analysis.txt file for ${postDir}`);
      } else {
        console.warn(`No analysis found for ${postDir}, skipping`);
        continue;
      }
      
      postAnalyses.push({
        title: metadata.title,
        analysis: analysisText,
        link: metadata.link,
        externalLink: metadata.externalLink
      });
    }
    
    if (postAnalyses.length === 0) {
      throw new Error(`No valid post analyses found for r/${subreddit}`);
    }
    
    // Create prompt for subreddit-level analysis
    const subredditAnalysisPrompt = `
      Create a comprehensive analysis of the subreddit r/${subreddit} based on the posts provided.

      Analyze these ${postAnalyses.length} posts collectively to identify:
      1. Major themes and topics across posts
      2. Notable trends and patterns in the content
      3. Community sentiment and points of controversy
      4. Significant insights or interesting discoveries

      Format as a well-structured briefing with:
      - A descriptive title for the subreddit analysis
      - An executive summary at the top (2-3 sentences)
      - Sections with clear headings for each major theme
      - Short, information-dense paragraphs
      - Occasional personal insights marked with 💡
      - Actionable takeaways when relevant

      Focus on FILTERING and PRIORITIZING valuable content:

      1. HIGHLIGHT the most important, informative, and newsworthy posts
         - Breaking news and major developments
         - Significant releases or updates
         - Important technical information
         - Expert analysis and high-quality insights
         - Notable trends with real impact

      2. IGNORE entirely:
         - Shitposts, memes and jokes
         - Common knowledge/redundant information
         - Low-effort questions and discussions
         - Personal anecdotes without broader relevance
         - Trivial updates with minimal impact

      Write with the voice of a highly knowledgeable and insightful analyst who has an extraordinary ability to synthesize information efficiently. Maintain a professional, authoritative tone with occasional flashes of understated wit. The goal is to come across as a uniquely perceptive human editor with uncanny insight.

      IMPORTANT: Include specific quotes, statistics, usernames, trends and concrete examples from the analyzed posts. Reference actual content rather than making general observations. Your analysis should be so specific that it could only apply to this particular set of r/${subreddit} posts.

      ALWAYS include direct links to the original posts using markdown format [Title](URL). For each significant post you mention, add its link so readers can visit the original sources. The post URLs are included with each post analysis below.

      Remember, the goal is QUALITY over QUANTITY - it's better to deeply analyze a few valuable posts than to superficially cover many low-value ones.

      Here are the post analyses to synthesize:
      
      ${postAnalyses.map((post, index) =>
        `--- POST ${index + 1}: ${post.title} ---\nPost URL: ${post.link}\n${post.analysis}\n`
      ).join('\n\n')}
    `;
    
    // Generate the subreddit analysis
    console.log(`Generating comprehensive analysis for r/${subreddit}...`);
    const subredditResponse = await openai.responses.create({
      model: ANALYSIS_MODEL,
      input: [{
        role: "user",
        content: [{ type: "input_text", text: subredditAnalysisPrompt }]
      }]
    });
    
    const subredditAnalysis = subredditResponse.output_text;
    
    // Save subreddit analysis to file
    const subredditAnalysisPath = path.join(subredditDir, 'subreddit_analysis.md');
    fs.writeFileSync(subredditAnalysisPath, subredditAnalysis);
    console.log(`Subreddit analysis saved to ${subredditAnalysisPath}`);
    
    return subredditAnalysis;
  } catch (error) {
    console.error(`Error generating subreddit analysis: ${error.message}`);
    return `Error generating subreddit analysis: ${error.message}`;
  }
}

/**
 * Generate a combined newsletter from all subreddit analyses
 * @param {string} recipientName - Name of the recipient for personalization
 * @param {Array<string>} subreddits - List of subreddits to include
 * @param {string} runDir - Directory containing the run data
 * @returns {Promise<string>} Newsletter content
 */
async function generateCombinedNewsletter(recipientName, subreddits, runDir) {
  try {
    console.log(`Generating combined newsletter for ${recipientName || 'all users'}...`);
    
    // Current date for newsletter
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Create newsletter intro
    let newsletter = `# tl;dr digest

Hey ${recipientName || 'there'},

Your personalized digest is ready. Here are today's key topics from ${currentDate}:

`;
    
    // Process each subreddit
    const subredditAnalyses = [];
    
    for (const subreddit of subreddits) {
      // Get subreddit analysis
      const subredditDir = path.join(runDir, subreddit);
      const analysisPath = path.join(subredditDir, 'subreddit_analysis.md');
      
      if (!fs.existsSync(analysisPath)) {
        console.warn(`Subreddit analysis not found for r/${subreddit}, generating it now...`);
        await generateSubredditAnalysis(subreddit, runDir);
        
        // Check again after generation attempt
        if (!fs.existsSync(analysisPath)) {
          console.warn(`Failed to generate analysis for r/${subreddit}, skipping`);
          continue;
        }
      }
      
      const subredditAnalysis = fs.readFileSync(analysisPath, 'utf8');
      
      subredditAnalyses.push({
        subreddit,
        analysis: subredditAnalysis
      });
    }
    
    if (subredditAnalyses.length === 0) {
      throw new Error('No valid subreddit analyses found');
    }
    
    // Create prompt for newsletter
    const newsletterPrompt = `
      Create a newsletter that summarizes key topics from these Reddit analyses, but organize by TOPIC CATEGORY rather than by subreddit.

      Group content into 4-6 clear thematic categories such as:
      - Technology & Software
      - Security & Privacy
      - Business & Industry News
      - Research & Science
      - Politics & Policy
      - Culture & Society
      - Tools & Resources
      (Choose categories that best fit the actual content you see)

      For each topic category:
      1. Create a concise, catchy category title prefixed with "##"
      2. Add 2-4 summarized items from ANY subreddit that fits this category
      3. Each item should have:
         - A clear headline in bold
         - A brief 1-3 sentence summary
         - An appropriate emoji at the start
         - Occasional personal insights marked with 💡
      4. Focus on interesting, informative takeaways

      DO NOT organize by subreddit or mention which subreddit content came from (though keep the original links intact).

      Focus ONLY on the most valuable, informative content. Prioritize:
      - Breaking news and recent developments
      - Significant releases, updates, and discoveries
      - Important security vulnerabilities, tools, and techniques
      - Expert insights and high-quality analysis
      - Industry trends with meaningful impact

      COMPLETELY IGNORE low-value content like:
      - Shitposts, memes, and joke threads
      - Redundant information already widely known
      - Trivial updates without substantial impact
      - Personal anecdotes without broader relevance
      - Generic questions or repetitive discussions

      Write in a knowing, informed tone with subtlety and wit. Include exactly one subtle joke or wry observation about the content (NOT about processing speed, efficiency, or data analysis capabilities). The goal is to sound like a highly knowledgeable human editor with a dry sense of humor and exceptional subject matter expertise.

      IMPORTANT: You MUST include specific insights, details and examples from the provided analyses - not generic summaries. Use actual names, numbers, and quotes when available. The newsletter should feel like a premium filter that only presents genuinely valuable information.

      CRITICAL: For each item you include, add a direct link to the original Reddit post using the format [Title](URL). The post URLs are included in each subreddit analysis you receive. This allows readers to visit the original sources for more information.

      Here are the subreddit analyses to summarize:

      ${subredditAnalyses.map(item => {
        // Construct the subreddit URL
        const subredditUrl = `https://reddit.com/r/${item.subreddit}`;
        return `--- SUBREDDIT: r/${item.subreddit} ---\nSubreddit URL: ${subredditUrl}\n${item.analysis}\n`;
      }).join('\n\n')}
    `;
    
    // Generate the newsletter
    console.log(`Generating newsletter content from all subreddit analyses...`);
    const newsletterResponse = await openai.responses.create({
      model: SUMMARY_MODEL,
      input: [{
        role: "user",
        content: [{ type: "input_text", text: newsletterPrompt }]
      }]
    });
    
    // Add generated content to newsletter
    newsletter += newsletterResponse.output_text;
    
    // Add footer
    newsletter += `

---

That's all for today's digest. Your next update will arrive at the same time tomorrow.

Stay informed,
The Reddit Insight Team
`;
    
    // Save newsletter to file
    const newsletterPath = path.join(runDir, `topic_digest_${recipientName || 'all'}.md`);
    fs.writeFileSync(newsletterPath, newsletter);
    console.log(`Topic-based digest saved to ${newsletterPath}`);
    
    return newsletter;
  } catch (error) {
    console.error(`Error generating topic-based digest: ${error.message}`);
    return `Error generating topic-based digest: ${error.message}`;
  }
}

/**
 * Process all analyses for a given run
 * @param {string} runDir - Directory containing the run data
 * @param {string} recipientName - Optional recipient name for personalization
 */
async function processAllAnalyses(runDir, recipientName = null) {
  try {
    console.log(`\nProcessing additional analyses for output directory: ${runDir}`);
    
    // Find all subreddit directories
    const subreddits = fs.readdirSync(runDir)
      .filter(item => 
        fs.statSync(path.join(runDir, item)).isDirectory() && 
        item !== 'screenshots' && 
        !item.startsWith('.')
      );
    
    if (subreddits.length === 0) {
      throw new Error(`No subreddit directories found in ${runDir}`);
    }
    
    console.log(`Found ${subreddits.length} subreddits: ${subreddits.join(', ')}`);
    
    // Generate subreddit analyses
    console.log(`\nGenerating subreddit-level analyses...`);
    for (const subreddit of subreddits) {
      await generateSubredditAnalysis(subreddit, runDir);
    }
    console.log(`\nSubreddit analyses completed successfully!`);
    
    // Generate combined newsletter
    console.log(`\nGenerating combined newsletter from all subreddits...`);
    await generateCombinedNewsletter(recipientName, subreddits, runDir);
    console.log(`\nCombined newsletter generated successfully!`);
    
    console.log(`\n====================================`);
    console.log(`All analyses completed successfully!`);
    console.log(`====================================`);
  } catch (error) {
    console.error(`Error processing analyses: ${error.message}`);
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  // Check if run directory and recipient are provided
  if (process.argv.length < 5 || process.argv[3] !== '--recipient') {
    console.error('\nERROR: Both run directory and recipient name are required.');
    console.error('Usage: node analyze.js <run_directory> --recipient "Recipient Name"\n');
    process.exit(1);
  }

  // Get the run directory
  const runDir = process.argv[2];

  // Extract recipient name
  const recipientName = process.argv[4];
  console.log(`Recipient name set to: "${recipientName}"`);

  // Run the analysis
  processAllAnalyses(runDir, recipientName);
}

// Export functions for use in other modules
module.exports = {
  generateSubredditAnalysis,
  generateCombinedNewsletter,
  processAllAnalyses
};