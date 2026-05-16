/**
 * AI Service — Hardcoded text analysis (no external API needed)
 * 
 * Implements intelligent text processing for:
 * - Summary generation (extractive summarization)
 * - Action item extraction (pattern matching)
 * - Title suggestion (key phrase extraction)
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about',
  'above', 'after', 'again', 'also', 'am', 'an', 'any', 'as', 'back',
  'because', 'before', 'between', 'come', 'down', 'even', 'first',
  'get', 'give', 'go', 'here', 'if', 'into', 'know', 'like', 'look',
  'make', 'much', 'new', 'now', 'over', 'people', 'say', 'see', 'take',
  'then', 'there', 'think', 'time', 'two', 'up', 'us', 'want', 'way',
  'well', 'work', 'year', 'also', 'let', 'still', 'since', 'long',
  'thing', 'things', 'going', 'really', 'already', 'etc', 'one'
]);

// Action item trigger patterns
const ACTION_PATTERNS = [
  /(?:need to|needs to)\s+(.+?)(?:\.|$)/gi,
  /(?:should|must|have to|has to)\s+(.+?)(?:\.|$)/gi,
  /(?:todo|to-do|to do)\s*:?\s*(.+?)(?:\.|$)/gi,
  /(?:action item|task)\s*:?\s*(.+?)(?:\.|$)/gi,
  /(?:remember to|don't forget to|make sure to)\s+(.+?)(?:\.|$)/gi,
  /(?:will|going to)\s+(.+?)(?:\.|$)/gi,
  /(?:plan to|planning to)\s+(.+?)(?:\.|$)/gi,
  /(?:assign|assigned to|responsible for)\s+(.+?)(?:\.|$)/gi,
  /(?:deadline|due|by)\s+(.+?)(?:\.|$)/gi,
  /(?:follow up|follow-up)\s*(?:on|with)?\s*(.+?)(?:\.|$)/gi,
  /(?:schedule|set up|arrange)\s+(.+?)(?:\.|$)/gi,
  /(?:review|check|verify|confirm|update|prepare|create|build|fix|resolve|complete|finish|implement|design|draft|send|submit|deliver)\s+(.+?)(?:\.|$)/gi,
];

// Bullet/list patterns that often contain action items
const BULLET_PATTERN = /^[\s]*[-•*]\s+(.+)$/gm;
const NUMBERED_PATTERN = /^[\s]*\d+[.)]\s+(.+)$/gm;

/**
 * Split text into sentences
 */
function splitSentences(text) {
  return text
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

/**
 * Calculate word frequencies (excluding stop words)
 */
function getWordFrequencies(text) {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq = {};
  
  for (const word of words) {
    if (!STOP_WORDS.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  
  return freq;
}

/**
 * Score a sentence based on word frequency
 */
function scoreSentence(sentence, wordFreq) {
  const words = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  if (words.length === 0) return 0;
  
  let score = 0;
  for (const word of words) {
    score += wordFreq[word] || 0;
  }
  
  // Normalize by sentence length (but favor slightly longer sentences)
  return score / Math.pow(words.length, 0.7);
}

/**
 * Generate an extractive summary from content
 */
export function generateSummary(content) {
  if (!content || content.trim().length < 20) {
    return 'Note is too short to generate a meaningful summary.';
  }

  const sentences = splitSentences(content);
  if (sentences.length === 0) {
    return 'Could not extract meaningful content for summarization.';
  }

  const wordFreq = getWordFrequencies(content);
  
  // Score and rank sentences
  const scored = sentences.map((sentence, index) => ({
    sentence,
    index,
    score: scoreSentence(sentence, wordFreq)
  }));

  // Sort by score, take top sentences (up to 3-4)
  const numSentences = Math.min(Math.max(2, Math.ceil(sentences.length * 0.3)), 4);
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => a.index - b.index); // Restore original order

  const summary = topSentences.map(s => s.sentence).join(' ');
  
  // Clean up
  return summary.replace(/\s+/g, ' ').trim();
}

/**
 * Extract action items from content
 */
export function extractActionItems(content) {
  if (!content || content.trim().length < 10) {
    return [];
  }

  const actionItems = new Set();

  // Extract from action patterns
  for (const pattern of ACTION_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const item = (match[2] || match[1]).trim();
      if (item.length > 5 && item.length < 150) {
        // Capitalize first letter
        const cleaned = item.charAt(0).toUpperCase() + item.slice(1);
        actionItems.add(cleaned.replace(/[.!?,;]*$/, ''));
      }
    }
  }

  // Extract from bullet points
  const bullets = content.match(BULLET_PATTERN) || [];
  for (const bullet of bullets) {
    const item = bullet.replace(/^[\s]*[-•*]\s+/, '').trim();
    if (item.length > 5 && item.length < 150) {
      actionItems.add(item.charAt(0).toUpperCase() + item.slice(1));
    }
  }

  // Extract from numbered lists
  const numbered = content.match(NUMBERED_PATTERN) || [];
  for (const num of numbered) {
    const item = num.replace(/^[\s]*\d+[.)]\s+/, '').trim();
    if (item.length > 5 && item.length < 150) {
      actionItems.add(item.charAt(0).toUpperCase() + item.slice(1));
    }
  }

  return [...actionItems].slice(0, 10);
}

/**
 * Suggest a title based on content
 */
export function suggestTitle(content) {
  if (!content || content.trim().length < 10) {
    return 'Untitled Note';
  }

  const wordFreq = getWordFrequencies(content);
  
  // Get top keywords
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  if (topWords.length === 0) {
    // Fallback: use first few words
    const firstWords = content.trim().split(/\s+/).slice(0, 5).join(' ');
    return firstWords.charAt(0).toUpperCase() + firstWords.slice(1);
  }

  // Try to find a sentence that contains the top keywords
  const sentences = splitSentences(content);
  const firstSentence = sentences[0] || content.trim().split('\n')[0] || '';
  
  // If first sentence/line is short enough, use it as title
  if (firstSentence.length <= 60 && firstSentence.length > 5) {
    return firstSentence.replace(/[.!?]*$/, '');
  }

  // Build title from top keywords
  const title = topWords
    .slice(0, 3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' & ');

  return `Notes: ${title}`;
}

/**
 * Run all AI analysis on content
 */
export function analyzeNote(content) {
  return {
    summary: generateSummary(content),
    action_items: extractActionItems(content),
    suggested_title: suggestTitle(content)
  };
}
