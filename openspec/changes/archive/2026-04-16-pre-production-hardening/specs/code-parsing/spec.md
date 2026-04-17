# Delta for Code Parsing

## MODIFIED Requirements

### Requirement: codeParser MUST return warnings array
The system SHALL return a warnings array containing all parsing issues found during processing, instead of failing silently.
(Previously: Returned empty array [] when parsing failed)

#### Scenario: Returns warnings for missing file markers
- GIVEN AI response without "File:" markers
- WHEN parseAIResponse is called
- THEN returns warnings array with "Missing file markers in response"

#### Scenario: Returns warnings for unclosed code blocks
- GIVEN AI response with ``` without closing ```
- WHEN parseAIResponse is called
- THEN returns warnings array with "Unclosed code block detected"

#### Scenario: Returns warnings for empty file content
- GIVEN AI response with "File: src/App.tsx" followed by empty code block
- WHEN parseAIResponse is called
- THEN returns warnings array with "Empty file content for: src/App.tsx"

#### Scenario: Returns empty warnings for valid input
- GIVEN AI response with proper File markers and closed code blocks
- WHEN parseAIResponse is called
- THEN returns warnings: [] (empty array) alongside files

### Requirement: Warnings MUST include detailed information
The system SHALL include specific details in each warning including the file path (if applicable), line number (if detectable), and issue description.

#### Scenario: Warning includes file path
- GIVEN parsing fails on specific file
- WHEN warning is generated
- THEN warning contains the file path where issue occurred

#### Scenario: Warning includes issue type
- GIVEN any parsing issue
- WHEN warning is generated
- THEN warning clearly states the type of issue

## ADDED Requirements

### Requirement: Parsing Result MUST include warnings field
The system SHALL return an object with a warnings array field: { message: string, files: ProjectFile[], warnings: string[] }

#### Scenario: Function returns correct structure
- GIVEN any input to parseAIResponse
- WHEN function completes
- THEN returned object has warnings array (may be empty)
