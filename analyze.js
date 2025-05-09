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

      The tone should be informative and engaging. Acknowledge that you are an AI analyzing Reddit content.

      IMPORTANT: Make sure to include SPECIFIC examples and insights from the content provided. Avoid generic statements that could apply to any subreddit.

      Here are the post analyses to synthesize:
      
      ${postAnalyses.map((post, index) => 
        `--- POST ${index + 1}: ${post.title} ---\n${post.analysis}\n`
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
    let newsletter = `# tl;dr ${subreddits.join(', ')} newsletter

Hey ${recipientName || 'there'},

I'm your AI-powered Reddit digest assistant. Here are topics from r/${subreddits.join(', r/')} that I analyzed for you today ${currentDate}:

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
      Create a newsletter that summarizes key topics from these Reddit subreddit analyses.

      For each subreddit section:
      1. Create a concise, catchy title prefixed with "##"
      2. Add 2-4 summarized items from that subreddit's analysis
      3. Each item should have:
         - A clear headline in bold
         - A brief 1-3 sentence summary
         - An appropriate emoji at the start
         - Occasional personal insights marked with 💡
      4. Focus on interesting, informative takeaways

      Be explicitly self-aware that you are an AI summarizing Reddit content. Make the tone knowledgeable but conversational, with minimal fluff and maximum information density.

      IMPORTANT: You MUST include actual insights from the provided analyses. Don't just create a template with placeholders or generic statements.

      Here are the subreddit analyses to summarize:

      ${subredditAnalyses.map(item =>
        `--- SUBREDDIT: r/${item.subreddit} ---\n${item.analysis}\n`
      ).join('\n\n')}
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

That's all for today! This newsletter was generated entirely by AI based on content from Reddit.

Stay informed,
Your AI Reddit Digest Assistant
`;
    
    // Save newsletter to file
    const newsletterPath = path.join(runDir, `${subreddits.join('_')}_newsletter_${recipientName || 'all'}.md`);
    fs.writeFileSync(newsletterPath, newsletter);
    console.log(`Combined newsletter saved to ${newsletterPath}`);
    
    return newsletter;
  } catch (error) {
    console.error(`Error generating combined newsletter: ${error.message}`);
    return `Error generating combined newsletter: ${error.message}`;
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