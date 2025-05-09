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
const reports = require('./reports');

// Initialize OpenAI client - will use environment variable OPENAI_API_KEY
const openai = new OpenAI();

// Constants
const ANALYSIS_MODEL = 'gpt-4.1';    // Model used for in-depth article/comment analysis
const SUMMARY_MODEL = 'gpt-4.1'; // Model used for quick one-word summaries

/**
 * Generate a subreddit analysis from individual post analyses based on report type
 * @param {string} subreddit - Name of the subreddit
 * @param {string} runDir - Directory containing the run data
 * @param {object} reportConfig - Report configuration to use
 * @returns {Promise<string>} Subreddit analysis content
 */
async function generateSubredditAnalysis(subreddit, runDir, reportConfig) {
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
    
    // Create prompt for subreddit-level analysis using the template from report config
    const subredditAnalysisPrompt = reportConfig.subredditAnalysisPrompt
      .replace(/{subreddit}/g, subreddit)
      .replace(/{postCount}/g, postAnalyses.length)
      .replace(/{postAnalyses}/g, postAnalyses.map((post, index) =>
        `--- POST ${index + 1}: ${post.title} ---\nPost URL: ${post.link}\n${post.analysis}\n`
      ).join('\n\n'));
    
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
 * @param {string|null} recipientName - Name of the recipient for personalization (optional)
 * @param {Array<string>} subreddits - List of subreddits to include
 * @param {string} runDir - Directory containing the run data
 * @param {object} reportConfig - Report configuration to use
 * @returns {Promise<string>} Newsletter content
 */
async function generateCombinedNewsletter(recipientName, subreddits, runDir, reportConfig) {
  try {
    console.log(`Generating combined newsletter for ${recipientName || 'all users'}...`);

    // Current date for newsletter
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create newsletter intro using the template from report config
    let newsletter = reportConfig.newsletterIntro
      .replace(/{recipient_name}/g, recipientName || 'there')
      .replace(/{date}/g, currentDate)
      .replace(/{subreddit}/g, 'combined');
    
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
    
    // Create prompt for combined newsletter using the template from report config
    const newsletterPrompt = reportConfig.combinedNewsletterPrompt
      .replace(/{subredditAnalyses}/g, subredditAnalyses.map(item => {
        // Construct the subreddit URL
        const subredditUrl = `https://reddit.com/r/${item.subreddit}`;
        return `--- SUBREDDIT: r/${item.subreddit} ---\nSubreddit URL: ${subredditUrl}\n${item.analysis}\n`;
      }).join('\n\n'));
    
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
    
    // Add footer from the report config
    newsletter += reportConfig.combinedNewsletterFooter;
    
    // Determine run ID from runDir path
    const runId = path.basename(runDir);

    // Create reports directory for this run
    const reportsDir = path.join('data', 'reports', runId);
    fs.mkdirSync(reportsDir, { recursive: true });

    // Save newsletter to file with report type in the filename
    const reportType = reportConfig.name.toLowerCase().replace(/\s+/g, '_');
    const newsletterPath = path.join(reportsDir, `combined_${reportType}_${recipientName || 'all'}.md`);
    fs.writeFileSync(newsletterPath, newsletter);
    console.log(`Combined ${reportConfig.name} saved to ${newsletterPath}`);
    
    return newsletter;
  } catch (error) {
    console.error(`Error generating topic-based digest: ${error.message}`);
    return `Error generating topic-based digest: ${error.message}`;
  }
}

/**
 * Process all analyses for a given run
 * @param {string} runDir - Directory containing the run data
 * @param {string|null} recipientName - Optional recipient name for personalization
 * @param {string} reportType - Type of report to generate (newsletter, market, academic)
 */
async function processAllAnalyses(runDir, recipientName = null, reportType = reports.DEFAULT_REPORT_TYPE) {
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

    // Get the report configuration based on type
    const reportConfig = reports.getReportConfig(reportType);
    console.log(`Using report type: ${reportConfig.name}`);

    // Generate subreddit analyses
    console.log(`\nGenerating subreddit-level analyses...`);
    for (const subreddit of subreddits) {
      await generateSubredditAnalysis(subreddit, runDir, reportConfig);
    }
    console.log(`\nSubreddit analyses completed successfully!`);

    // Generate combined newsletter
    console.log(`\nGenerating combined ${reportConfig.name} from all subreddits...`);
    await generateCombinedNewsletter(recipientName, subreddits, runDir, reportConfig);
    console.log(`\nCombined ${reportConfig.name} generated successfully!`);
    
    console.log(`\n====================================`);
    console.log(`All analyses completed successfully!`);
    console.log(`====================================`);
  } catch (error) {
    console.error(`Error processing analyses: ${error.message}`);
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  // Check if run directory is provided
  if (process.argv.length < 3) {
    console.error('\nERROR: Run directory is required.');
    console.error('Usage: node analyze.js <run_directory> [--recipient "Name"] [--type newsletter|market|academic]\n');
    process.exit(1);
  }

  // Get the run directory
  const runDir = process.argv[2];
  let argIndex = 3;

  // Default values
  let recipientName = null;
  let reportType = reports.DEFAULT_REPORT_TYPE;

  // Process command line flags
  while (process.argv.length > argIndex && process.argv[argIndex].startsWith('--')) {
    const flag = process.argv[argIndex];

    if (flag === '--recipient' && process.argv.length > argIndex + 1) {
      recipientName = process.argv[argIndex + 1];
      console.log(`Recipient name set to: "${recipientName}"`);
      argIndex += 2;
    }
    else if (flag === '--type' && process.argv.length > argIndex + 1) {
      const requestedType = process.argv[argIndex + 1].toLowerCase();
      const availableTypes = reports.getAvailableReportTypes();

      if (availableTypes.includes(requestedType)) {
        reportType = requestedType;
        console.log(`Report type set to: "${reportType}"`);
      } else {
        console.warn(`Warning: Unknown report type "${requestedType}". Using default type "${reports.DEFAULT_REPORT_TYPE}"`);
        console.warn(`Available types: ${availableTypes.join(', ')}`);
      }
      argIndex += 2;
    }
    else {
      console.error(`\nERROR: Unknown or incomplete flag: ${flag}`);
      console.error(`Usage: node analyze.js <run_directory> [--recipient "Name"] [--type newsletter|market|academic]\n`);
      process.exit(1);
    }
  }

  if (!recipientName) {
    console.log('No recipient name provided, using default greeting');
  }

  // Run the analysis
  processAllAnalyses(runDir, recipientName, reportType);
}

// Export functions for use in other modules
module.exports = {
  generateSubredditAnalysis,
  generateCombinedNewsletter,
  processAllAnalyses
};