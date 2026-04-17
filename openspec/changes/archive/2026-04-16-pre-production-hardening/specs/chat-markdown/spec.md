# Delta for Chat Markdown

## MODIFIED Requirements

### Requirement: ChatPanel Markdown MUST be sanitized
The system SHALL render Markdown using rehype-sanitize plugin to prevent XSS attacks from malicious AI responses.
(Previously: Raw ReactMarkdown render without sanitization)

#### Scenario: Script tag is stripped from Markdown
- GIVEN AI response containing `<script>alert('xss')</script>`
- WHEN ChatPanel renders the message
- THEN script tag is removed or escaped

#### Scenario: Event handlers are stripped
- GIVEN AI response containing `<img onerror="alert(1)" src="x">`
- WHEN ChatPanel renders the message
- THEN onerror handler is removed

#### Scenario: Links to dangerous protocols are blocked
- GIVEN AI response containing `<a href="javascript:alert(1)">click</a>`
- WHEN ChatPanel renders the message
- THEN href is removed or sanitized

### Requirement: Safe Markdown features MUST still work
The system SHALL allow safe Markdown elements like bold, italic, code blocks, links, and tables after sanitization.
(Previously: All Markdown worked but without sanitization)

#### Scenario: Bold and italic render correctly
- GIVEN AI response with **bold** and *italic*
- WHEN ChatPanel renders
- THEN text appears bold and italic

#### Scenario: Code blocks render correctly
- GIVEN AI response with ```javascript code ```
- WHEN ChatPanel renders
- THEN code block displays with formatting

#### Scenario: Links render correctly
- GIVEN AI response with [text](https://example.com)
- WHEN ChatPanel renders
- THEN clickable link is displayed

#### Scenario: Tables render correctly
- GIVEN AI response with markdown table
- WHEN ChatPanel renders
- THEN table displays with proper formatting

### Requirement: remark-gfm plugin MUST be preserved
The system SHALL continue using remark-gfm for GitHub Flavored Markdown (tables, strikethrough, etc.) alongside rehype-sanitize.
(Previously: remark-gfm was used, this continues)

#### Scenario: GFM features work with sanitization
- GIVEN AI response with | table | and ~~strikethrough~~
- WHEN rendered with remark-gfm + rehype-sanitize
- THEN both features display correctly
