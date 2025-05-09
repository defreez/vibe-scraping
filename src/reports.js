/**
 * reports.js - Report type configurations
 * 
 * This module defines different report types with their templates
 * and configurations, making it easy to add new report types.
 */

// Available report types
const REPORT_TYPES = {
  newsletter: "newsletter",
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


// Academic analysis configuration
const academicConfig = {
  name: "Literature Review",
  description: "A scholarly analysis for academic research and literature review",

  // Templates
  newsletterIntro: `# Literature Review: r/{subreddit}

Dear {recipient_name},

Your academic literature review from r/{subreddit} as of {date} is now available. This analysis follows a systematic review approach to synthesize content for academic research purposes:

`,
  
  subredditAnalysisPrompt: `
  Conduct a formal literature review of content from the subreddit r/{subreddit} following academic research standards.

  Apply systematic literature review methodology to analyze these {postCount} posts, focusing on:
  1. State of current knowledge and key research questions
  2. Predominant theoretical frameworks and conceptual models
  3. Methodological approaches, data collection, and analysis techniques
  4. Empirical findings, evidential support, and interpretation
  5. Research gaps, contradictions, and potential directions for future research
  6. Practical implications for researchers, practitioners, and policymakers

  Structure your literature review following standard academic format:
  - Abstract: A concise summary of the review findings (150-200 words)
  - Introduction: Purpose and scope of the review, research questions addressed
  - Methodology: Approach to identifying, categorizing, and analyzing the literature
  - Results: Systematic presentation of findings organized by theoretical constructs
  - Discussion: Synthesis of key themes, contradictions, and limitations
  - Conclusion: Implications for research and practice, future research agenda

  Apply strict academic selection criteria:
  1. INCLUDE only academically-relevant content:
     - Primary research with clearly defined methodology
     - Theoretical contributions with conceptual rigor
     - Evidence-supported findings and interpretations
     - Systematic analyses with research implications
     - Critical evaluations of existing literature

  2. EXCLUDE non-scholarly content:
     - Anecdotal reports without methodological foundations
     - Unsubstantiated claims lacking evidential support
     - Popular opinions without theoretical grounding
     - Commercial content without research value
     - Simplified summaries without analytical depth

  Write in the formal academic style of a published literature review in a peer-reviewed journal. Employ precise terminology, maintain objectivity, and structure arguments logically. Identify limitations in both your methodology and the content analyzed.

  IMPORTANT: Use proper academic citation format [Author, Year](URL) throughout. Include direct quotations where appropriate with clear attribution. Maintain a critical scholarly distance while analyzing content.

  ESSENTIAL: Position your analysis within the broader academic discourse. Identify how this content contributes to existing scholarly debates, theoretical development, and methodological innovation. Note limitations in generalizability and research quality.

  Here are the post analyses to synthesize as literature:
  {postAnalyses}
`,

  combinedNewsletterPrompt: `
  Produce a systematic literature review that integrates findings from multiple sources following academic research conventions.

  Structure this review according to standard academic literature review format:

  # Systematic Literature Review: Analysis of Online Discourse

  ## Abstract
  Begin with a formal abstract (200-250 words) summarizing the review's purpose, methodology, key findings, and implications.

  ## 1. Introduction
  - Establish research context and significance
  - Articulate clear research questions
  - Define scope and objectives of the review
  - Outline theoretical framework guiding the analysis

  ## 2. Methodology
  - Detail the systematic review approach
  - Specify inclusion/exclusion criteria
  - Explain data extraction and synthesis methods
  - Address methodological limitations

  ## 3. Results
  Organize by THEORETICAL CONSTRUCTS rather than sources:
  - Conceptual Frameworks & Theoretical Developments
  - Methodological Approaches & Analytical Techniques
  - Empirical Findings & Evidential Base
  - Contextual Factors & Boundary Conditions
  - Contradictions & Theoretical Tensions

  ## 4. Discussion
  - Synthesize findings across theoretical boundaries
  - Identify patterns, contradictions, and gaps
  - Relate findings to existing scholarly literature
  - Discuss theoretical and practical implications

  ## 5. Conclusion & Research Agenda
  - Summarize key contributions to the field
  - Articulate explicit limitations of the review
  - Propose specific directions for future research
  - Discuss implications for theory development

  MAINTAIN RIGOROUS ACADEMIC STANDARDS:
  1. Include ONLY scholarly contributions:
     - Empirical studies with sound methodology
     - Theoretical work with conceptual depth
     - Systematic analyses with supporting evidence
     - Critical evaluations of existing knowledge
     - Research with clear theoretical implications

  2. Apply consistent exclusion criteria:
     - Non-empirical assertions without substantiation
     - Methodologically unsound investigations
     - Theoretically superficial observations
     - Content lacking scholarly contribution
     - Material outside defined scope parameters

  Employ formal academic writing conventions appropriate for a peer-reviewed journal article. Use precise disciplinary terminology, maintain scholarly objectivity, and construct logical, evidence-based arguments. Address counter-evidence and alternative interpretations.

  CITATION REQUIREMENTS: Implement formal academic citation practices [Author](URL) consistently throughout the text. Include in-text citations for all claims derived from source material.

  Here are the subreddit analyses to synthesize into a comprehensive literature review:
  {subredditAnalyses}
`,

  newsletterItemPrompt: `
  Evaluate this content according to strict academic literature review inclusion criteria.

  Apply the following inclusion criteria for academic merit:
  - Original empirical research with explicit methodology
  - Rigorous theoretical contributions with clear conceptual frameworks
  - Systematic analyses with substantiated arguments
  - Methodological innovations with research design implications
  - Critical reviews with comprehensive analysis of existing literature
  - Interdisciplinary work with theoretical integration across domains

  Apply the following exclusion criteria:
  - Studies lacking methodological rigor or transparency
  - Conceptual discussions without theoretical grounding
  - Claims without sufficient empirical support
  - Opinion-based or advocacy-oriented content
  - Non-systematic reviews or narrative summaries
  - Commercial or promotional content
  - Studies outside the scope of the defined research questions

  If the content meets inclusion criteria, create a formal literature review entry with:
  - Formal academic heading identifying the theoretical contribution (## format)
  - Research design and methodological approach
  - Key findings with statistical or empirical evidence
  - Theoretical implications and contribution to knowledge
  - Limitations and methodological constraints
  - Research gaps addressed and future research directions
  - Formal academic citation: [Author, Year]({postLink})

  If the content fails to meet inclusion criteria, respond with "EXCLUDED_FROM_REVIEW" only.

  Write in formal academic prose suitable for a peer-reviewed journal article. Employ discipline-specific terminology, maintain objective scholarly distance, and structure content according to academic conventions.

  Material for evaluation:
  {analysisText}
`,

  combinedNewsletterFooter: `
---

## References

[List of all sources cited in this review]

## Appendix: Methodological Notes

This systematic review followed PRISMA guidelines for identification, screening, and inclusion of relevant sources. The methodology involved a systematic search and screening process, followed by thematic analysis of included materials.

---

Department of Interdisciplinary Research
Academic Research Division
`
};

// Map of all report configurations
const reportConfigs = {
  [REPORT_TYPES.newsletter]: newsletterConfig,
  [REPORT_TYPES.academic]: academicConfig
};

/**
 * Get a report configuration by type
 * @param {string} type - The report type (newsletter, academic)
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