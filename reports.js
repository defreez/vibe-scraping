/**
 * reports.js - Report type configurations
 * 
 * This module defines different report types with their templates
 * and configurations, making it easy to add new report types.
 */

// Available report types
const REPORT_TYPES = {
  newsletter: "newsletter",
  market: "market", 
  academic: "academic"
};

// Default report type
const DEFAULT_REPORT_TYPE = REPORT_TYPES.newsletter;

// Newsletter type configuration
const newsletterConfig = {
  name: "Newsletter",
  description: "A general newsletter with insights on the latest content",
  
  // Templates
  newsletterIntro: `# tl;dr {subreddit}

Hey {recipient_name},

Your personalized Reddit digest for r/{subreddit} is ready. Here are today's notable topics from {date} that align with your interests:

`,
  
  subredditAnalysisPrompt: `
  Create a comprehensive analysis of the subreddit r/{subreddit} based on the posts provided.

  Analyze these {postCount} posts collectively to identify:
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

  IMPORTANT: Include specific quotes, statistics, usernames, trends and concrete examples from the analyzed posts. Reference actual content rather than making general observations. Your analysis should be so specific that it could only apply to this particular set of r/{subreddit} posts.

  ALWAYS include direct links to the original posts using markdown format [Title](URL). For each significant post you mention, add its link so readers can visit the original sources. The post URLs are included with each post analysis below.

  Remember, the goal is QUALITY over QUANTITY - it's better to deeply analyze a few valuable posts than to superficially cover many low-value ones.

  Here are the post analyses to synthesize:
  {postAnalyses}
`,

  combinedNewsletterPrompt: `
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
  {subredditAnalyses}
`,

  newsletterItemPrompt: `
  I need a high-quality newsletter summary for this Reddit content analysis.

  First, evaluate if this content is truly worth including:

  INCLUDE content that is:
  - Breaking news or major developments
  - Significant releases or technical updates
  - Expert analyses with valuable insights
  - Important security or industry information
  - Novel ideas or concepts of substantial interest

  EXCLUDE entirely any content that is:
  - Memes, jokes, or shitposts
  - Common knowledge or redundant information
  - Low-effort questions or discussions
  - Personal anecdotes without broader relevance
  - Trivial updates with minimal impact

  If the content meets the quality threshold, write a concise headline + 2-4 sentence summary.
  Include a single emoji at the start that represents the content.
  Start with a ## heading with a catchy title.

  IMPORTANT: Always include a direct link to the original Reddit post in your summary using the markdown format [Title]({postLink})

  The link format should be:
  - Title should be a very short (2-5 words) version of the headline
  - The link itself should be the original post URL: {postLink}
  - Place this link either at the beginning or end of your summary

  If the content does NOT meet the quality threshold, respond with "LOW_VALUE_CONTENT" and I'll skip this post.

  Write as if you're a highly perceptive human editor with extraordinary analytical abilities and a subtle, dry sense of humor. The tone should be knowledgeable, authoritative, and slightly witty. Avoid any references to efficiency, processing speed, or data analysis capabilities in your humor.

  Here's the analysis:
  {analysisText}
`,

  combinedNewsletterFooter: `
---

That's all for today's digest. Your next update will arrive at the same time tomorrow.

Stay informed,
The Reddit Insight Team
`
};

// Market analysis configuration
const marketConfig = {
  name: "Market Analysis",
  description: "A business and market-focused analysis of content",
  
  // Templates
  newsletterIntro: `# Market Analysis: r/{subreddit}

Hey {recipient_name},

Here's your market intelligence report based on Reddit r/{subreddit} from {date}. Key market insights:

`,
  
  subredditAnalysisPrompt: `
  Create a comprehensive market analysis of the subreddit r/{subreddit} focused on business insights.

  Analyze these {postCount} posts collectively to identify:
  1. Market trends and emerging business opportunities
  2. Consumer sentiment and preference shifts
  3. Competitive landscape insights and company movements
  4. Product feedback and feature requests
  5. Industry challenges and pain points

  Format as a structured market intelligence report with:
  - A concise executive summary highlighting key business insights
  - Market trend analysis with potential business implications
  - Competitive analysis sections when relevant
  - Consumer sentiment metrics (positive/negative/neutral) 
  - Actionable business intelligence takeaways

  Focus on FILTERING for business-relevant content:

  1. HIGHLIGHT content with business relevance:
     - Market shifts and business strategy discussions
     - Consumer behavior patterns and preferences
     - Pricing feedback and willingness-to-pay indicators
     - Competitive analysis and company comparisons
     - Product feedback with commercial implications

  2. IGNORE content without business relevance:
     - Technical details without market impact
     - Personal anecdotes without broader market implications
     - Political discussions unless directly impacting business
     - Memes and jokes without consumer insight value
     - Academic discussions without commercial relevance

  Write with the voice of a professional market analyst with strong business acumen. Maintain a data-driven, insights-focused tone with emphasis on actionable intelligence. The goal is to surface valuable market intelligence that could inform business decisions.

  IMPORTANT: Include specific market metrics, sentiment indicators, and business intelligence from the analyzed posts. Quantify observations where possible (X% of comments expressed Y). Your analysis should provide actionable market insights derived from this specific dataset.

  ALWAYS include direct links to relevant source posts using markdown format [Title](URL) for reference.

  Remember, the goal is ACTIONABLE BUSINESS INTELLIGENCE - prioritize insights that could inform product, marketing, or business strategy decisions.

  Here are the post analyses to synthesize:
  {postAnalyses}
`,

  combinedNewsletterPrompt: `
  Create a market intelligence report that synthesizes key business insights from these Reddit analyses.

  Organize content by MARKET SECTORS rather than by subreddit:
  - Technology Markets
  - Consumer Products & Services
  - Financial Markets
  - Healthcare & Biotech
  - Media & Entertainment
  - Other Emerging Markets
  (Adjust sectors to fit the actual content analyzed)

  For each market sector:
  1. Create a sector heading prefixed with "##"
  2. Provide 2-3 key market trends or business insights
  3. Each insight should include:
     - A business-focused headline in bold
     - Key metrics or quantified observations when possible (X% market response)
     - Impact assessment (high/medium/low business relevance)
     - Actionable recommendations for business strategy

  PRIORITIZE content with clear business intelligence value:
  - Consumer sentiment shifts and emerging preferences
  - Product feedback with revenue implications
  - Competitive landscape insights
  - Market trend indicators and early signals
  - Business model and strategy discussions

  IGNORE content without clear business relevance, including:
  - Technical discussions without market impact
  - Personal stories without broader market implications
  - Political content unless directly affecting business
  - Entertainment content without consumer insight value

  Write in a professional, data-driven business analyst style. Focus on actionable intelligence that could inform strategic decisions. Include specific metrics, sentiment indicators, and business implications where possible.

  CRITICAL: For each significant insight, include a link to the source using [Source](URL) format to enable deeper investigation.

  Here are the subreddit analyses to synthesize into market intelligence:
  {subredditAnalyses}
`,

  newsletterItemPrompt: `
  Evaluate this content for business intelligence value.

  INCLUDE insights that are:
  - Indicative of market trends or shifts
  - Revealing consumer preferences or behaviors
  - Highlighting competitive dynamics or strategies
  - Providing product feedback with revenue implications
  - Offering early signals of emerging opportunities or threats

  EXCLUDE content without clear business relevance:
  - Technical details without market impact
  - Personal anecdotes without broader market implications
  - General news without business intelligence value
  - Entertainment content without consumer insight value

  If the content has business intelligence value, create a concise market insight summary with:
  - A clear business-focused headline (## format)
  - Key metrics or quantified observations when possible
  - Potential business implications or opportunities
  - A direct link to source using [More](URL) format: {postLink}

  If the content lacks business intelligence value, respond with "LOW_BUSINESS_VALUE" only.

  Write as a professional market analyst focused on actionable business intelligence. Be concise, data-driven, and strategic in your assessments.

  Content to evaluate:
  {analysisText}
`,

  combinedNewsletterFooter: `
---

This concludes your market intelligence report. Next update scheduled for tomorrow.

For strategic insights,
Market Intelligence Team
`
};

// Academic analysis configuration
const academicConfig = {
  name: "Academic Analysis",
  description: "A scholarly analysis focusing on research implications",
  
  // Templates
  newsletterIntro: `# Academic Analysis: r/{subreddit}

Dear {recipient_name},

Your research digest from r/{subreddit} as of {date} is now available. This analysis highlights content with scholarly and research implications:

`,
  
  subredditAnalysisPrompt: `
  Conduct a comprehensive academic analysis of the subreddit r/{subreddit} with a focus on research implications.

  Analyze these {postCount} posts to identify:
  1. Research themes, methodologies, and findings
  2. Theoretical frameworks and conceptual discussions
  3. Scholarly debates and areas of academic consensus/disagreement
  4. Research gaps and potential future directions
  5. Practical applications of theoretical knowledge

  Structure your analysis as an academic literature review with:
  - An abstract summarizing key findings (100-150 words)
  - Thematic sections organized by research domain
  - Methodological considerations and limitations
  - Theoretical implications of the discussions
  - Suggestions for future research directions

  PRIORITIZE content with scholarly value:
  1. HIGHLIGHT academically relevant content:
     - Primary research findings and methodological discussions
     - Theoretical frameworks and conceptual developments
     - Interdisciplinary connections and applications
     - Scholarly debates with substantive arguments
     - Evidence-based perspectives and critical analyses

  2. EXCLUDE content lacking scholarly merit:
     - Anecdotal evidence without methodological rigor
     - Assertions without supporting evidence
     - Superficial observations without analytical depth
     - Opinion pieces without theoretical grounding
     - Promotional content without research value

  Write with the voice of a scholarly researcher producing a literature review. Maintain an objective, analytical tone with precise language and proper academic framing. The goal is to synthesize and contextualize the content within relevant theoretical frameworks.

  IMPORTANT: Cite specific posts using formal citation style [Author, Year](URL) when referencing content. Integrate quotes and examples to support your analysis, and acknowledge limitations in the data.

  CRITICAL: Your analysis should identify connections to established literature, methodological considerations, and potential contributions to theory development. Focus on the scholarly implications rather than surface-level observations.

  Here are the post analyses to synthesize:
  {postAnalyses}
`,

  combinedNewsletterPrompt: `
  Create a comprehensive research digest that synthesizes content from these Reddit analyses through an academic lens.

  Organize content by RESEARCH DOMAINS rather than by subreddit:
  - Theoretical Frameworks & Conceptual Advances
  - Methodological Innovations & Challenges
  - Empirical Findings & Evidence
  - Interdisciplinary Connections & Applications
  - Emerging Research Questions & Future Directions
  (Adjust domains based on the actual content analyzed)

  For each research domain:
  1. Create a scholarly heading (## format)
  2. Present 2-3 key research insights with:
     - Clear articulation of the theoretical or methodological significance
     - Contextual placement within established literature (where possible)
     - Critical assessment of limitations and constraints
     - Implications for theory development or methodological practice

  INCLUDE only content with clear scholarly value:
  - Research findings with methodological rigor
  - Theoretical discussions with conceptual depth
  - Evidence-based analyses with critical perspective
  - Methodological innovations or challenges
  - Interdisciplinary connections with substantive integration

  EXCLUDE content lacking scholarly merit:
  - Anecdotal accounts without methodological framing
  - Opinion pieces without theoretical foundations
  - Promotional content without research implications
  - Superficial observations without analytical depth

  Write in an academic style appropriate for a scholarly audience. Maintain objective analysis while highlighting theoretical significance and research implications. Use precise language, acknowledge limitations, and suggest directions for future inquiry.

  IMPORTANT: For each significant insight, use formal citation style [Author](URL) to reference source material. 

  Here are the subreddit analyses to synthesize into a research digest:
  {subredditAnalyses}
`,

  newsletterItemPrompt: `
  Evaluate this content for scholarly and research value.

  INCLUDE content with academic merit:
  - Research findings with methodological details
  - Theoretical discussions with conceptual depth
  - Critical analyses with substantive arguments
  - Methodological challenges or innovations
  - Interdisciplinary connections with research implications

  EXCLUDE content lacking scholarly value:
  - Anecdotal evidence without methodological framing
  - Assertions without supporting evidence
  - Opinion pieces without theoretical grounding
  - Promotional content without research implications
  - Superficial observations without analytical depth

  If the content has scholarly merit, create a concise research note with:
  - A descriptive academic heading (## format)
  - Theoretical context or methodological framework
  - Key findings or conceptual contributions
  - Research implications or future directions
  - Formal citation to source: [Source]({postLink})

  If the content lacks scholarly value, respond with "INSUFFICIENT_SCHOLARLY_MERIT" only.

  Write in a formal academic style appropriate for a scholarly publication. Focus on theoretical significance, methodological considerations, and research implications.

  Content to evaluate:
  {analysisText}
`,

  combinedNewsletterFooter: `
---

This concludes the current research digest. The next compilation will be available tomorrow.

In pursuit of knowledge,
Research Analysis Team
`
};

// Map of all report configurations
const reportConfigs = {
  [REPORT_TYPES.newsletter]: newsletterConfig,
  [REPORT_TYPES.market]: marketConfig,
  [REPORT_TYPES.academic]: academicConfig
};

/**
 * Get a report configuration by type
 * @param {string} type - The report type (newsletter, market, academic)
 * @returns {object} The report configuration
 */
function getReportConfig(type) {
  // Return requested config or default if not found
  return reportConfigs[type] || reportConfigs[DEFAULT_REPORT_TYPE];
}

/**
 * Get available report types
 * @returns {Array<string>} Array of available report type keys
 */
function getAvailableReportTypes() {
  return Object.keys(reportConfigs);
}

// Export the module
module.exports = {
  REPORT_TYPES,
  DEFAULT_REPORT_TYPE,
  getReportConfig,
  getAvailableReportTypes
};