# How MarkMind AI Makes Decisions

This document explains how MarkMind uses artificial intelligence to organize your bookmarks effectively.

## Overview

MarkMind uses Google's Gemini AI to analyze your bookmarks and suggest an organized folder structure. The AI makes decisions based on several factors:

1. **Content Analysis**
   - Analyzes bookmark titles and URLs
   - Identifies common themes and topics
   - Recognizes content categories (e.g., social media, development, news)

2. **Pattern Recognition**
   - Identifies similar bookmarks
   - Groups related content together
   - Maintains consistent categorization

3. **Existing Structure**
   - Respects your current folder organization
   - Uses existing folders when appropriate
   - Creates new folders only when necessary

## Decision Process

1. **Initial Analysis**
   - Collects bookmark metadata (titles, URLs)
   - Cleans and normalizes data
   - Identifies primary content types

2. **Categorization**
   - Groups similar content
   - Creates hierarchical relationships
   - Maintains folder depth limit (max 3 levels)

3. **Optimization**
   - Balances folder sizes
   - Ensures logical grouping
   - Maintains clear navigation

## Examples

### URL Analysis
```
Input: "github.com/react/docs"
Decision: Development > JavaScript > React

Input: "twitter.com/user"
Decision: Social Media > Twitter

Input: "medium.com/article-about-ai"
Decision: Reading > Technology > AI
```

### Title Analysis
```
Input: "How to Build a React App"
Decision: Development > Tutorials > React

Input: "Breaking News: Tech Update"
Decision: News > Technology
```

## Privacy Considerations

- Only bookmark titles and URLs are analyzed
- No personal data is collected or stored
- Analysis happens locally in your browser
- AI suggestions are generated in real-time

## Limitations

The AI system:
- Cannot read bookmark content, only metadata
- Maintains a maximum folder depth of 3 levels
- Prioritizes existing folders when possible
- May require manual adjustments for specific needs

## Continuous Improvement

The AI system improves by:
- Learning from common patterns
- Adapting to user preferences
- Maintaining consistency across sessions
- Following best practices for bookmark organization

## User Control

You always have control over:
- Which bookmarks to organize
- Approving suggested changes
- Modifying folder structure
- Final organization decisions 