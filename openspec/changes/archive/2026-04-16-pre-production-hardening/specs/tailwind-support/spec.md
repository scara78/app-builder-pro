# Delta for Tailwind Support

## MODIFIED Requirements

### Requirement: SYSTEM_PROMPT MUST mention plain CSS, not Tailwind
The system SHALL instruct the AI to use plain CSS for styling in prompts, removing references to Tailwind CSS.
(Previously: SYSTEM_PROMPT said "You use React, Vite, and Tailwind CSS" but tailwindcss not installed)

#### Scenario: SYSTEM_PROMPT specifies plain CSS
- GIVEN SYSTEM_PROMPT constant
- WHEN AI generates app
- THEN prompt says "plain CSS" or "CSS" instead of "Tailwind"

#### Scenario: AI generates plain CSS files
- GIVEN user prompt "Create a login form"
- WHEN AI responds with code
- THEN response includes index.css with plain CSS (not Tailwind classes)

### Requirement: Tailwind via WebContainer MAY be optional
The system MAY support installing Tailwind in WebContainer if explicitly requested by user, as an advanced option.
(Previously: Either claim Tailwind without it, or no option existed)

#### Scenario: User requests Tailwind explicitly
- GIVEN user prompt includes "use Tailwind" or "install Tailwind"
- WHEN AI processes request
- THEN WebContainer may install tailwindcss and configure it

#### Scenario: Default is plain CSS
- GIVEN user prompt does not mention Tailwind
- WHEN AI generates app
- THEN plain CSS is used by default

### Requirement: Output Apps MUST work with plain CSS
The system SHALL ensure generated apps function correctly using plain CSS, verifying that AI output produces working applications.
(Previously: AI generated Tailwind classes that wouldn't render)

#### Scenario: Generated app renders correctly
- GIVEN AI generates app with plain CSS
- WHEN app is mounted in WebContainer and rendered
- THEN styles are applied correctly (no missing Tailwind)

#### Scenario: CSS is properly linked
- GIVEN AI generates index.css with styles
- WHEN App.tsx renders
- THEN index.css is imported and styles apply
