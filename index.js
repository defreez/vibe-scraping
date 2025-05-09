/**
 * Reddit Vibe Scraping Demo
 * 
 * Scrapes Reddit posts, extracts article content from linked pages, 
 * and analyzes both the article and user comments using GPT models.
 * 
 * @author @defreez
 * @presented White Rabbit on 2025-05-08
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const sharp = require('sharp');
const analyze = require('./analyze');
const reports = require('./reports');

// Constants
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';
const IMAGE_MODEL = 'gpt-4.1-mini';  // Model used for image analysis and article extraction
const ANALYSIS_MODEL = 'gpt-4.1';    // Model used for in-depth article/comment analysis
const SUMMARY_MODEL = 'gpt-4.1'; // Model used for quick one-word summaries
const DEFAULT_SUBREDDITS = ['news', 'ashland'];
const POSTS_PER_SUBREDDIT = 3;  // Number of posts to scrape per subreddit (can be modified)

// Prompt Templates
const ARTICLE_EXTRACTION_PROMPT_TEMPLATE = `Analyze this webpage screenshot and extract the main article content. 
Ignore navigation elements, ads, and other non-content sections.
Format the output as clean text with paragraphs preserved.

If it appears that this is not an article but just a single image, then analyze the image
and return a description of what is in the image suitable for a blind person.

Translate to English if necessary.

URL: {externalLink}`;

const PHRASE_SUMMARY_TEMPLATE = `Summarize the following post title with a descriptive phrase of 1-3 words that captures its essence.
Return the phrase with words separated by underscores (like_this_example) with no punctuation or additional text.

Translate to English if necessary.

Title: {postTitle}

underscore_separated_phrase:`;

const ARTICLE_ANALYSIS_PROMPT_TEMPLATE = `
# Analysis: "{postTitle}"

## Article Information
Title: {postTitle}
Reddit Link: {postLink}
{externalLinkSection}

## Article Content
{articleText}

## Top Reddit Comments
{formattedComments}

## Analysis Task
Please analyze both the post content (which may be an image, text, or an external article) and the comments to provide insights on:
1. Main points of the post/content
2. Key themes in the comments
3. Overall sentiment of commenters toward the post topic
4. Any notable disagreements or controversies in the comments

If the post contains an image, describe what's in the image and how it relates to the comments.

Start your analysis with a bold heading that includes the post title.
Format your analysis in clear sections with descriptive headers.
Use the style of a concise, informative newsletter like tl;dr sec.
`;

// Template variables will be loaded from reports.js based on report type

// Initialize OpenAI client - will use environment variable OPENAI_API_KEY
const openai = new OpenAI();

/**
 * Splits an image into multiple chunks of specified width and height
 * @param {Buffer} imageBuffer - The original image buffer
 * @param {number} targetWidth - Target width in pixels (default: 768px)
 * @param {number} chunkHeight - Height of each chunk in pixels (default: 2000px)
 * @returns {Promise<Array<Buffer>>} Array of image buffers, each representing a chunk
 */
async function splitImageIntoChunks(imageBuffer, targetWidth = 768, chunkHeight = 2000) {

  // Step 1: Resize to target width while maintaining aspect ratio
  const resizedBuffer = await sharp(imageBuffer)
    .resize({
      width: targetWidth,
      height: null, // Maintain aspect ratio
      fit: 'inside',
      withoutEnlargement: false // Allow enlarging if original is smaller
    })
    .toBuffer();

  // Update metadata after resize
  const resizedMetadata = await sharp(resizedBuffer).metadata();

  // Step 2: Split into chunks if height exceeds chunkHeight
  const chunks = [];
  const totalHeight = resizedMetadata.height;
  const numChunks = Math.ceil(totalHeight / chunkHeight);

  for (let i = 0; i < numChunks; i++) {
    const startY = i * chunkHeight;
    const currentChunkHeight = Math.min(chunkHeight, totalHeight - startY);

    // Skip if we've reached the end
    if (currentChunkHeight <= 0) break;

    console.log(`Creating chunk ${i + 1}/${numChunks}: ${resizedMetadata.width}x${currentChunkHeight} pixels from position y=${startY}`);

    // Extract the chunk
    const chunkBuffer = await sharp(resizedBuffer)
      .extract({
        left: 0,
        top: startY,
        width: resizedMetadata.width,
        height: currentChunkHeight
      })
      .toBuffer();

    chunks.push(chunkBuffer);
  }

  return chunks;
}

/**
 * Converts an image buffer to base64 string
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {string} Base64 string of the image
 */
function bufferToBase64(imageBuffer) {
  return imageBuffer.toString('base64');
}

/**
 * Analyze an image by splitting it into chunks and analyzing all chunks in a single API call
 * @param {string} imagePath - Path to the image
 * @param {string} prompt - Prompt for image analysis
 * @returns {Promise<string>} Analysis text from all chunks
 */
async function analyzeImage(imagePath, prompt) {
  try {
    console.log(`Analyzing image with ${IMAGE_MODEL} (multi-image analysis): ${imagePath}`);

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);

    // Split the image into chunks
    console.log('Splitting image into manageable chunks...');
    const imageChunks = await splitImageIntoChunks(imageBuffer, 768, 2000);
    const totalChunks = imageChunks.length;
    console.log(`Split complete. Will send ${totalChunks} chunks in a single API call...`);

    // Create content array with all images
    const content = [
      {
        type: "input_text",
        text: `${prompt}\n\nI'm sending you ${totalChunks} screenshot sections of this webpage in order from top to bottom. Please analyze all of them together and extract the article content.`
      }
    ];

    for (let i = 0; i < imageChunks.length; i++) {
      const base64Image = bufferToBase64(imageChunks[i]);
      content.push({
        type: "input_image",
        image_url: `data:image/png;base64,${base64Image}`
      });
    }

    // Send all chunks in a single API call
    console.log(`Sending ${totalChunks} image chunks to ${IMAGE_MODEL}...`);
    const response = await openai.responses.create({
      model: IMAGE_MODEL,
      input: [{
        role: "user",
        content: content
      }]
    });

    // Return the analysis text
    const analysisText = response.output_text || 'No analysis generated';
    console.log(`Successfully generated ${analysisText.length} characters of analysis for all chunks`);
    return analysisText;
  } catch (error) {
    console.error(`Error analyzing image: ${error.message}`);
    return `Error analyzing image: ${error.message}`;
  }
}

/**
 * Extract comments from a Reddit post page
 * @param {Page} page - Puppeteer page object with the Reddit post loaded
 * @returns {Promise<Array>} Array of comment objects
 */
async function extractComments(page) {
  try {
    console.log('Extracting comments from the Reddit post...');

    // Auto-scroll a bit to ensure comments are loaded
    await autoScroll(page);

    // Simple extraction of comments using the actual observed structure
    const comments = await page.evaluate(() => {
      // Use shreddit-comment elements which are Reddit's custom elements for comments
      const commentElements = Array.from(document.querySelectorAll('shreddit-comment'));
      console.log(`Found ${commentElements.length} shreddit-comment elements`);

      // Map each comment element to its data
      return commentElements.map(comment => {
        // Only extract what we can reliably find
        return {
          // Author name if available
          author: comment.getAttribute('author') || 'Unknown',

          // Comment points/score if available
          score: comment.getAttribute('score') || '0',

          // Whether the comment is from the original poster
          isOP: comment.hasAttribute('is-op'),

          // Comment depth in the thread hierarchy (0 = top level)
          depth: parseInt(comment.getAttribute('depth') || '0', 10),

          // Get the comment ID for reference
          id: comment.id || '',

          // Get when the comment was created
          timestamp: comment.getAttribute('created') || '',

          // The actual comment text content (using slot="comment")
          // This might need adjustment based on the actual structure
          text: (() => {
            const commentSlot = comment.querySelector('[slot="comment"]');
            return commentSlot ? commentSlot.textContent.trim() : '';
          })()
        };
      });
    });

    console.log(`Extracted ${comments.length} comments from the post`);
    return comments;
  } catch (error) {
    console.error(`Error extracting comments: ${error.message}`);
    return []; // Return empty array on error
  }
}

/**
 * Analyze post content (image/text/article) and comments using GPT-4.1
 * @param {string} articleText - The extracted article text
 * @param {Array} comments - Array of comment objects
 * @param {string} postTitle - Title of the Reddit post
 * @param {string} postLink - Link to the Reddit post
 * @param {string} externalLink - External link URL (for link posts)
 * @param {string} postScreenshotPath - Path to the post screenshot
 * @returns {Promise<string>} Analysis text
 */
async function analyzeArticleAndComments(articleText, comments, postTitle, postLink, externalLink = '', postScreenshotPath = '') {
  try {
    console.log(`Analyzing post content and ${comments.length} comments with ${ANALYSIS_MODEL}...`);

    // Format comments for inclusion in the prompt
    let formattedComments = '';
    if (comments.length > 0) {
      // Take first 10 comments (already sorted by Reddit's default "best" algorithm)
      const topComments = comments.slice(0, 10);

      formattedComments = topComments.map(comment => {
        return `---\nAuthor: ${comment.author}${comment.isOP ? ' (Original Poster)' : ''}\nScore: ${comment.score}\nComment: ${comment.text}\n---`;
      }).join('\n\n');
    } else {
      formattedComments = 'No comments available';
    }

    // Create the prompt for analysis
    const externalLinkSection = externalLink ? `External Link: ${externalLink}` : '';
    const articleTextContent = articleText || 'No article content available';

    const prompt = ARTICLE_ANALYSIS_PROMPT_TEMPLATE
      .replace('{postTitle}', postTitle)
      .replace('{postLink}', postLink)
      .replace('{externalLinkSection}', externalLinkSection)
      .replace('{articleText}', articleTextContent)
      .replace('{formattedComments}', formattedComments);

    // Prepare content array for OpenAI request
    const content = [
      { type: "input_text", text: prompt }
    ];

    // Process and add post screenshot if available
    if (postScreenshotPath && fs.existsSync(postScreenshotPath)) {
      console.log(`Processing post screenshot for analysis: ${postScreenshotPath}`);
      try {
        // Read the image
        const imageBuffer = fs.readFileSync(postScreenshotPath);
        
        // Resize to 768px width and take top 2000px
        const processedBuffer = await sharp(imageBuffer)
          .resize({
            width: 768,
            height: null, // Maintain aspect ratio
            fit: 'inside',
            withoutEnlargement: false
          })
          .extract({
            left: 0,
            top: 0,
            width: 768,
            height: Math.min(2000, (await sharp(imageBuffer).metadata()).height)
          })
          .toBuffer();
        
        // Convert to base64
        const base64Image = processedBuffer.toString('base64');
        
        // Add to content array
        content.push({
          type: "input_image",
          image_url: `data:image/png;base64,${base64Image}`
        });
        
        console.log('Post screenshot processed and added to analysis');
      } catch (imgError) {
        console.error(`Error processing post screenshot: ${imgError.message}`);
      }
    }

    // Send to GPT-4.1 for analysis
    console.log('Sending to OpenAI for analysis...');
    const response = await openai.responses.create({
      model: ANALYSIS_MODEL,
      input: [{
        role: "user",
        content: content
      }]
    });

    // Return the analysis text
    const analysisText = response.output_text || 'No analysis generated';
    console.log(`Successfully generated ${analysisText.length} characters of post content and comment analysis`);
    return analysisText;
  } catch (error) {
    console.error(`Error analyzing post content and comments: ${error.message}`);
    return `Error analyzing post content and comments: ${error.message}`;
  }
}

/**
 * Generate an underscore_separated_phrase summary of a post title
 * @param {string} postTitle - The title of the post
 * @returns {Promise<string>} An underscore_separated_phrase
 */
async function getPhraseSummary(postTitle) {
  try {
    console.log(`Generating phrase summary for post title using ${SUMMARY_MODEL}...`);

    // Create the prompt
    const prompt = PHRASE_SUMMARY_TEMPLATE.replace('{postTitle}', postTitle);

    // Send to OpenAI
    const response = await openai.responses.create({
      model: SUMMARY_MODEL,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt }
        ]
      }]
    });

    // Get the phrase summary and ensure it's properly formatted
    let summary = response.output_text.trim().toLowerCase();

    console.log(`Generated phrase summary: "${summary}"`);
    return summary;
  } catch (error) {
    console.error(`Error generating phrase summary: ${error.message}`);
    return 'post_summary'; // Fallback on error
  }
}

/**
 * Auto-scroll a page to ensure all lazy-loaded content is visible
 * @param {Page} page - Puppeteer page object
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const scrollInterval = 100;
      const maxScrolls = 30; // Limit to prevent infinite scrolling
      let scrollCount = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;

        // Stop if we've scrolled to the bottom or reached max scrolls
        if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
          clearInterval(timer);
          // Scroll back to top for a clean screenshot start
          window.scrollTo(0, 0);
          resolve();
        }
      }, scrollInterval);
    });
  });

  // Wait longer after scrolling to ensure everything loads (3 seconds)
  console.log('Waiting after scroll for content to settle...');
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Process a single subreddit, scraping top posts and their content
 * @param {Browser} browser - Puppeteer browser instance
 * @param {string} subreddit - Subreddit name to scrape
 * @param {string} baseOutputDir - Base output directory for this run
 * @returns {Promise<void>}
 */
async function processSubreddit(browser, subreddit, baseOutputDir) {
  console.log(`\n========== Processing r/${subreddit} ==========`);
  
  try {
    // Create a new page
    const page = await browser.newPage();

    // Set Chrome on Mac user agent
    await page.setUserAgent(USER_AGENT);

    // Navigate to Reddit subreddit
    console.log(`Navigating to https://reddit.com/r/${subreddit}...`);
    await page.goto(`https://reddit.com/r/${subreddit}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Scroll down to load more posts using our auto-scroll function
    console.log('Auto-scrolling to load more posts...');
    await autoScroll(page);
    console.log('Auto-scrolling completed');

    // Create subreddit directory
    const subredditDir = path.join(baseOutputDir, subreddit);
    fs.mkdirSync(subredditDir, { recursive: true });

    // Create a shared screenshots directory for the main page
    const sharedScreenshotsDir = path.join(subredditDir, 'screenshots');
    fs.mkdirSync(sharedScreenshotsDir, { recursive: true });

    // Take a full page screenshot of the main page
    console.log('Taking full page screenshot of main page...');
    const mainPageScreenshotPath = path.join(sharedScreenshotsDir, 'main_page.png');
    await page.screenshot({ path: mainPageScreenshotPath, fullPage: true });
    console.log(`Main page screenshot saved in ${sharedScreenshotsDir}`);

    // Get the full HTML
    console.log('Dumping complete HTML content...');
    const htmlContent = await page.content();
    fs.writeFileSync(path.join(subredditDir, 'page.html'), htmlContent);
    console.log(`HTML content saved to ${subredditDir}/page.html`);

    // Extract posts data using the provided selectors based on the actual HTML structure
    console.log('Extracting post information...');
    const postsData = await page.evaluate(() => {
      const posts = Array.from(document.querySelectorAll('shreddit-post'));

      return posts.map(post => {
        // Get title element
        const titleElement = post.querySelector('a[slot="title"], [id^="post-title-"]');

        // Get username - author attribute is available directly on the shreddit-post
        const username = post.getAttribute('author') || 'No username found';

        // Get permalink from the post
        const permalink = post.getAttribute('permalink') || '';
        const fullLink = permalink ? 'https://reddit.com' + permalink : 'No link found';

        // Check if this is a link post (has content-href attribute) or a text post
        const contentHref = post.getAttribute('content-href') || '';
        const isLinkPost = contentHref && contentHref.startsWith('http');

        return {
          title: titleElement ? titleElement.textContent.trim() : 'No title found',
          link: fullLink,
          username: username,
          isLinkPost: isLinkPost,
          externalLink: isLinkPost ? contentHref : ''
        };
      });
    });

    // Limit to configured number of posts per subreddit
    const postsToVisit = postsData.slice(0, POSTS_PER_SUBREDDIT);

    // Save the extracted post data to JSON file
    fs.writeFileSync(path.join(subredditDir, 'posts.json'), JSON.stringify(postsData, null, 2));
    console.log(`Found ${postsData.length} posts. Data saved to ${subredditDir}/posts.json`);
    console.log(`Will visit first ${postsToVisit.length} posts.`);

    // Close the subreddit main page to free up resources
    await page.close();

    // Visit each post and take screenshots
    for (let i = 0; i < postsToVisit.length; i++) {
      const post = postsToVisit[i];

      if (post.link && post.link !== 'No link found') {
        console.log(`\n[Post ${i + 1}/${postsToVisit.length}]`);
        console.log(`Title: ${post.title}`);
        console.log(`Author: ${post.username}`);
        console.log(`Link: ${post.link}`);

        try {
          // Get an underscore-separated phrase summary of the post title
          const phraseSummary = await getPhraseSummary(post.title);

          // Create a directory name with post number and phrase summary
          const dirName = `post_${i + 1}_${phraseSummary}`;

          // Create directory for this specific post
          const postDir = path.join(subredditDir, dirName);
          fs.mkdirSync(postDir, { recursive: true });

          // Create post-specific screenshots directory
          const postScreenshotsDir = path.join(postDir, 'screenshots');
          fs.mkdirSync(postScreenshotsDir, { recursive: true });

          // Save post metadata
          fs.writeFileSync(
            path.join(postDir, 'metadata.json'),
            JSON.stringify({
              title: post.title,
              author: post.username,
              link: post.link,
              isLinkPost: post.isLinkPost,
              externalLink: post.externalLink || null
            }, null, 2)
          );

          // Create a new page for each post to avoid frame detachment issues
          const postPage = await browser.newPage();
          await postPage.setUserAgent(USER_AGENT);

          // Navigate to the post page
          console.log(`Navigating to post...`);
          await postPage.goto(post.link, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });

          // Create a safe filename for the screenshot
          const screenshotPath = path.join(postScreenshotsDir, 'post.png');

          // Take a screenshot
          console.log('Taking screenshot of post page...');
          await postPage.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`Screenshot saved to ${screenshotPath}`);

          // Save post HTML
          const postHtml = await postPage.content();
          fs.writeFileSync(path.join(postDir, 'post.html'), postHtml);

          // Extract comments from the post
          console.log('Extracting comments from post...');
          const commentsData = await extractComments(postPage);

          // Save comments data
          fs.writeFileSync(
            path.join(postDir, 'comments.json'),
            JSON.stringify(commentsData, null, 2)
          );
          console.log(`${commentsData.length} comments saved to ${postDir}/comments.json`);

          // Variable to hold article text - may be populated from external link if available
          let articleText = '';
          let externalDir = '';

          // If this is a link post, follow the external link and take a screenshot
          if (post.isLinkPost && post.externalLink) {
            console.log(`This is a link post. Following external link: ${post.externalLink}`);

            try {
              // Create an external content directory
              externalDir = path.join(postDir, 'external');
              fs.mkdirSync(externalDir, { recursive: true });

              // Create a new page for the external link
              const externalPage = await browser.newPage();
              await externalPage.setUserAgent(USER_AGENT);

              // Navigate to the external link
              await externalPage.goto(post.externalLink, {
                // Wait until both network is idle AND page is fully loaded
                waitUntil: ['networkidle2', 'load', 'domcontentloaded'],
                timeout: 30000  // Timeout for slower sites
              });

              // Scroll the external page to load more content
              console.log('Scrolling external link page to load more content...');
              await autoScroll(externalPage);
              
              // Wait longer for dynamic content to fully load (images, JS, etc.)
              console.log('Waiting for additional content to load (5 seconds)...');
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Take a screenshot of the external link page
              const externalScreenshotPath = path.join(postScreenshotsDir, 'external.png');

              console.log('Taking screenshot of external link...');
              await externalPage.screenshot({ path: externalScreenshotPath, fullPage: true });
              console.log(`External link screenshot saved to ${externalScreenshotPath}`);

              // Save external link HTML
              const externalHtml = await externalPage.content();
              fs.writeFileSync(path.join(externalDir, 'external.html'), externalHtml);

              // Analyze the screenshot with GPT-4.1-mini to extract article text
              console.log('Analyzing external link screenshot with GPT-4.1-mini...');

              const extractionPrompt = ARTICLE_EXTRACTION_PROMPT_TEMPLATE.replace('{externalLink}', post.externalLink);

              articleText = await analyzeImage(externalScreenshotPath, extractionPrompt);

              // Save extracted article text
              fs.writeFileSync(path.join(externalDir, 'article.txt'), articleText);
              console.log(`Article text analysis saved to ${externalDir}/article.txt`);

              // Close the external page
              await externalPage.close();
            } catch (error) {
              console.error(`Error accessing external link for post ${i + 1}: ${error.message}`);
              // We'll continue with analysis even if external link fails
              articleText = 'Unable to access external link: ' + error.message;
              
              // Create external directory if it doesn't exist yet
              if (!externalDir) {
                externalDir = path.join(postDir, 'external');
                fs.mkdirSync(externalDir, { recursive: true });
              }
              
              // Save error as article text
              fs.writeFileSync(path.join(externalDir, 'article.txt'), articleText);
            }
          }

          // Always run analysis regardless of whether external link succeeded
          try {
            // Analyze the post content (with screenshot), article text, and comments with GPT-4.1
            console.log('Running analysis on post and comments...');
            const analysis = await analyzeArticleAndComments(
              articleText,
              commentsData,
              post.title,
              post.link,
              post.isLinkPost ? post.externalLink : '',
              screenshotPath // Pass the post screenshot path
            );

            // Save the combined analysis in markdown format
            fs.writeFileSync(path.join(postDir, 'analysis.md'), analysis);
            console.log(`Combined analysis saved to ${postDir}/analysis.md`);
          } catch (analysisError) {
            console.error(`Error analyzing post ${i + 1}: ${analysisError.message}`);
          }

          // Close the post page
          await postPage.close();

          // Optional: wait a bit between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error navigating to post ${i + 1}: ${error.message}`);
        }
      } else {
        console.log(`\n[Post ${i + 1}/${postsToVisit.length}]`);
        console.log(`Invalid link for post: ${post.title}`);
      }
    }

    console.log(`\nCompleted processing r/${subreddit}. All content saved to ${subredditDir}`);
  } catch (error) {
    console.error(`Error processing subreddit r/${subreddit}:`, error);
  }
}

/**
 * Generate a newsletter from the analysis results based on report type
 * @param {string|null} recipientName - Name of the recipient for personalization (optional)
 * @param {string} subreddit - Name of the subreddit
 * @param {string} runDir - Directory containing the run data
 * @param {object} reportConfig - The report configuration to use
 * @returns {Promise<string>} Newsletter content
 */
async function generateNewsletter(recipientName, subreddit, runDir, reportConfig) {
  try {
    console.log(`Generating ${reportConfig.name} for ${recipientName || 'all users'} from r/${subreddit}...`);

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

    // Current date for newsletter
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create newsletter intro using the template from report config
    let newsletter = reportConfig.newsletterIntro
      .replace('{recipient_name}', recipientName || 'there')
      .replace('{subreddit}', subreddit)
      .replace('{date}', currentDate);

    // Process each post
    for (const postDir of postDirs) {
      const fullPostDir = path.join(subredditDir, postDir);

      // Get post metadata
      const metadataPath = path.join(fullPostDir, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        console.warn(`Metadata not found for ${postDir}, skipping`);
        continue;
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

      // Get analysis (checking for .md first, then .txt as fallback)
      let analysisText;
      const analysisMdPath = path.join(fullPostDir, 'analysis.md');
      const analysisTxtPath = path.join(fullPostDir, 'analysis.txt');

      if (fs.existsSync(analysisMdPath)) {
        analysisText = fs.readFileSync(analysisMdPath, 'utf8');
      } else if (fs.existsSync(analysisTxtPath)) {
        analysisText = fs.readFileSync(analysisTxtPath, 'utf8');
      } else {
        console.warn(`No analysis found for ${postDir}, skipping`);
        continue;
      }

      // Extract key points from analysis for newsletter using the configured template
      const newsletterPrompt = reportConfig.newsletterItemPrompt
        .replace('{postLink}', metadata.link)
        .replace('{analysisText}', analysisText);

      // Generate the newsletter section
      console.log(`Generating newsletter section for ${metadata.title}...`);
      const response = await openai.responses.create({
        model: SUMMARY_MODEL,
        input: [{
          role: "user",
          content: [{ type: "input_text", text: newsletterPrompt }]
        }]
      });

      // Check if content is high enough quality to include
      if (response.output_text.trim() === "LOW_VALUE_CONTENT") {
        console.log(`Skipping low-value content: ${metadata.title}`);
      } else {
        // Add high-quality section to newsletter
        newsletter += response.output_text + '\n\n';
      }
    }

    // Add footer from the report config
    newsletter += reportConfig.combinedNewsletterFooter
      .replace('{subreddit}', subreddit);

    // Save report to file with report type in the filename
    const reportType = reportConfig.name.toLowerCase().replace(/\s+/g, '_');
    const newsletterPath = path.join(runDir, `${subreddit}_${reportType}_${recipientName || 'default'}.md`);
    fs.writeFileSync(newsletterPath, newsletter);
    console.log(`${reportConfig.name} saved to ${newsletterPath}`);

    return newsletter;
  } catch (error) {
    console.error(`Error generating newsletter: ${error.message}`);
    return `Error generating newsletter: ${error.message}`;
  }
}

async function main() {
  // Parse command line arguments
  let recipientName = null;
  let reportType = reports.DEFAULT_REPORT_TYPE;
  let subreddits = DEFAULT_SUBREDDITS;
  let argIndex = 2;

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
      console.error(`Usage: node index.js [--recipient "Name"] [--type newsletter|market|academic] [subreddits...]\n`);
      process.exit(1);
    }
  }

  if (!recipientName) {
    console.log('No recipient name provided, using default greeting');
  }

  // Get subreddits from command line or use defaults
  if (process.argv.length > argIndex) {
    subreddits = process.argv.slice(argIndex);
  }

  // Get the report configuration based on type
  const reportConfig = reports.getReportConfig(reportType);

  console.log(`Preparing to scrape ${subreddits.length} subreddits: r/${subreddits.join(', r/')}`);

  // Create a run ID (YYYYMMDD_HHMM format)
  const now = new Date();
  const runId = now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/[-:]/g, '');

  // Create base output directory structure for this run
  const baseOutputDir = path.join('output', runId);
  fs.mkdirSync(baseOutputDir, { recursive: true });

  // Launch the browser (shared across all subreddits)
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });

  try {
    // Process each subreddit
    for (const subreddit of subreddits) {
      await processSubreddit(browser, subreddit, baseOutputDir);
    }

    console.log(`\n====================================`);
    console.log(`All subreddits processed successfully!`);
    console.log(`Output saved to: output/${runId}/`);

    // Generate single-subreddit newsletters with the selected report type
    for (const subreddit of subreddits) {
      await generateNewsletter(recipientName, subreddit, baseOutputDir, reportConfig);
    }
    console.log(`Individual subreddit ${reportConfig.name.toLowerCase()} reports generated successfully!`);

    // Generate subreddit-level analyses
    console.log(`\nGenerating subreddit-level analyses...`);
    for (const subreddit of subreddits) {
      await analyze.generateSubredditAnalysis(subreddit, baseOutputDir, reportConfig);
    }
    console.log(`Subreddit analyses completed successfully!`);

    // Generate combined report
    console.log(`\nGenerating combined ${reportConfig.name} from all content...`);
    try {
      // Verify that subreddit analyses exist
      let allAnalysesExist = true;
      for (const subreddit of subreddits) {
        const analysisPath = path.join(baseOutputDir, subreddit, 'subreddit_analysis.md');
        if (!fs.existsSync(analysisPath)) {
          console.warn(`Warning: Subreddit analysis not found at ${analysisPath}`);
          allAnalysesExist = false;
        }
      }

      if (allAnalysesExist) {
        await analyze.generateCombinedNewsletter(recipientName, subreddits, baseOutputDir, reportConfig);
        console.log(`Combined ${reportConfig.name} generated successfully!`);
      } else {
        console.error(`Combined ${reportConfig.name} generation skipped due to missing subreddit analyses.`);
      }
    } catch (error) {
      console.error(`Error generating topic-based digest: ${error.message}`);
    }
    console.log(`====================================`);
  } catch (error) {
    console.error('An error occurred during processing:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

main();
