import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from '../components/chat/ChatPanel';

describe('ChatPanel', () => {
  it('should sanitize script tags from markdown', () => {
    const messages = [
      {
        id: '1',
        role: 'assistant' as const,
        content: '<script>alert("xss")</script>Hello',
        timestamp: Date.now(),
      },
    ];

    render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

    // Script tags should be removed/sanitized - check it's not rendered as plain text
    const container = document.body;
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('should NOT call onSendMessage when send button is clicked with empty input', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();

    render(<ChatPanel messages={[]} onSendMessage={onSendMessage} isGenerating={false} />);

    // The send button has type="submit" and class "btn-send"
    const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(sendButton).not.toBeNull();
    expect(sendButton.disabled).toBe(true);

    // Clicking a disabled button should not trigger the handler
    await user.click(sendButton);

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('should call onSendMessage with input content when user types and clicks send', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();

    render(<ChatPanel messages={[]} onSendMessage={onSendMessage} isGenerating={false} />);

    const textarea = screen.getByPlaceholderText(/Describe an enhancement/i);
    await user.type(textarea, 'Build a todo app');

    const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(false);

    await user.click(sendButton);

    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledWith('Build a todo app');
  });

  it('should clear input after sending message', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();

    render(<ChatPanel messages={[]} onSendMessage={onSendMessage} isGenerating={false} />);

    const textarea = screen.getByPlaceholderText(/Describe an enhancement/i);
    await user.type(textarea, 'Hello world');

    const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(sendButton);

    expect(textarea).toHaveValue('');
  });

  it('should disable send button and textarea while generating', () => {
    const onSendMessage = vi.fn();

    render(<ChatPanel messages={[]} onSendMessage={onSendMessage} isGenerating={true} />);

    const textarea = screen.getByPlaceholderText(/Describe an enhancement/i);
    expect(textarea).toBeDisabled();

    const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);
  });

  it('should render messages with correct role classes', () => {
    const messages = [
      { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
      { id: '2', role: 'assistant' as const, content: 'Hi there', timestamp: Date.now() },
    ];

    render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

    const userMessage = document.querySelector('[data-testid="message-item"][data-role="user"]');
    const assistantMessage = document.querySelector(
      '[data-testid="message-item"][data-role="assistant"]'
    );

    expect(userMessage).not.toBeNull();
    expect(assistantMessage).not.toBeNull();
  });

  it('should show empty state when no messages', () => {
    render(<ChatPanel messages={[]} onSendMessage={() => {}} isGenerating={false} />);

    expect(screen.getByText('Start building')).toBeInTheDocument();
  });

  it('should show generating indicator when isGenerating is true', () => {
    render(<ChatPanel messages={[]} onSendMessage={() => {}} isGenerating={true} />);

    const indicator = document.querySelector('[data-testid="typing-indicator"]');
    expect(indicator).not.toBeNull();
  });

  it('should send message on Enter key (without Shift)', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();

    render(<ChatPanel messages={[]} onSendMessage={onSendMessage} isGenerating={false} />);

    const textarea = screen.getByPlaceholderText(/Describe an enhancement/i);
    await user.type(textarea, 'Build a dashboard');

    // Press Enter to submit (not Shift+Enter)
    await user.type(textarea, '{Enter}');

    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledWith('Build a dashboard');
  });

  it('should sanitize user input before sending', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();

    render(<ChatPanel messages={[]} onSendMessage={onSendMessage} isGenerating={false} />);

    const textarea = screen.getByPlaceholderText(/Describe an enhancement/i);
    await user.type(textarea, '<script>alert("xss")</script>');

    const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(sendButton);

    // onSendMessage should receive sanitized content (script tags removed by sanitizeInput)
    expect(onSendMessage).toHaveBeenCalledTimes(1);
    // The sanitizeInput function strips HTML tags, so the script tag content is removed
    expect(onSendMessage).toHaveBeenCalledWith('');
  });

  // ============ SEC-CM: Chat Markdown XSS Protection ============

  describe('SEC-CM: Chat Markdown XSS Protection', () => {
    // ============ SEC-CM-001: Script Tag Stripping ============
    describe('SEC-CM-001: Script Tag Stripping', () => {
      it('SHALL strip script tag from AI response (SEC-CM-001 Scenario 1)', () => {
        const messages = [
          {
            id: '1',
            role: 'assistant' as const,
            // rehype-sanitize strips <script> and its text content entirely
            // "Safe text" is OUTSIDE the script so it survives
            content: 'Safe text\n\n<script>alert("xss")</script>',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        // No script element in DOM
        expect(document.querySelector('script')).toBeNull();
        // Safe text outside the script is still visible
        expect(screen.getByText('Safe text')).toBeInTheDocument();
      });

      it('SHALL strip script tag with src attribute (SEC-CM-001 Scenario 2)', () => {
        const messages = [
          {
            id: '2',
            role: 'assistant' as const,
            content: '<script src="https://evil.com/payload.js"></script>',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        expect(document.querySelector('script')).toBeNull();
        // No reference to evil.com anywhere
        expect(document.body.innerHTML).not.toContain('evil.com');
      });
    });

    // ============ SEC-CM-002: Event Handler Stripping ============
    describe('SEC-CM-002: Event Handler Stripping', () => {
      it('SHALL strip img onerror handler (SEC-CM-002 Scenario 1)', () => {
        const messages = [
          {
            id: '3',
            role: 'assistant' as const,
            content: '<img onerror="alert(1)" src="x">',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        // rehype-sanitize default schema strips onerror — img may be stripped entirely or rendered without onerror
        const imgs = document.querySelectorAll('img');
        imgs.forEach((img) => {
          expect(img.getAttribute('onerror')).toBeNull();
        });
        // No onerror attribute anywhere in the rendered output
        expect(document.body.innerHTML).not.toContain('onerror');
      });

      it('SHALL strip div onclick handler (SEC-CM-002 Scenario 2)', () => {
        const messages = [
          {
            id: '4',
            role: 'assistant' as const,
            content: '<div onclick="alert(1)">click me</div>',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        // No onclick attribute anywhere
        expect(document.body.innerHTML).not.toContain('onclick');
      });
    });

    // ============ SEC-CM-003: Dangerous Protocol Blocking ============
    describe('SEC-CM-003: Dangerous Protocol Blocking', () => {
      it('SHALL block javascript: protocol in link href (SEC-CM-003 Scenario 1)', () => {
        const messages = [
          {
            id: '5',
            role: 'assistant' as const,
            content: '[click](javascript:alert(1))',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        // rehype-sanitize removes the href entirely (getAttribute returns null)
        // or strips the javascript: protocol — either way, no javascript: in DOM
        const links = document.querySelectorAll('a');
        links.forEach((link) => {
          const href = link.getAttribute('href');
          if (href !== null) {
            expect(href).not.toContain('javascript:');
          }
        });
        // Also check raw HTML — rehype-sanitize either strips href or the entire link
        expect(document.body.innerHTML).not.toContain('javascript:');
      });

      it('SHALL block data:text/html protocol in link href (SEC-CM-003 Scenario 2)', () => {
        const messages = [
          {
            id: '6',
            role: 'assistant' as const,
            content: '<a href="data:text/html,<script>alert(1)</script>">click</a>',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        // No data:text/html in any href
        const links = document.querySelectorAll('a');
        links.forEach((link) => {
          expect(link.getAttribute('href')).not.toContain('data:text/html');
        });
      });
    });

    // ============ SEC-CM-004: Safe Markdown Formatting Preserved ============
    describe('SEC-CM-004: Safe Markdown Formatting Preserved', () => {
      it('SHALL render bold and italic correctly (SEC-CM-004 Scenario 1)', () => {
        const messages = [
          {
            id: '7',
            role: 'assistant' as const,
            content: '**bold** and *italic*',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        expect(document.querySelector('strong')).not.toBeNull();
        expect(document.querySelector('em')).not.toBeNull();
      });

      it('SHALL render inline code correctly (SEC-CM-004 Scenario 2)', () => {
        const messages = [
          {
            id: '8',
            role: 'assistant' as const,
            content: 'Use `console.log` to debug',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        expect(document.querySelector('code')).not.toBeNull();
      });
    });

    // ============ SEC-CM-005: Code Blocks Preserved ============
    describe('SEC-CM-005: Code Blocks Preserved', () => {
      it('SHALL render fenced code block (SEC-CM-005 Scenario 1)', () => {
        const messages = [
          {
            id: '9',
            role: 'assistant' as const,
            content: '```javascript\nconsole.log("hello");\n```',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        const pre = document.querySelector('pre');
        expect(pre).not.toBeNull();
        const code = pre?.querySelector('code');
        expect(code).not.toBeNull();
      });
    });

    // ============ SEC-CM-006: Safe Links Preserved ============
    describe('SEC-CM-006: Safe Links Preserved', () => {
      it('SHALL render HTTPS link correctly (SEC-CM-006 Scenario 1)', () => {
        const messages = [
          {
            id: '10',
            role: 'assistant' as const,
            content: '[docs](https://example.com)',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        const link = document.querySelector('a[href="https://example.com"]');
        expect(link).not.toBeNull();
      });
    });

    // ============ SEC-CM-007: GFM Tables Preserved ============
    describe('SEC-CM-007: GFM Tables Preserved', () => {
      it('SHALL render GFM table correctly (SEC-CM-007 Scenario 1)', () => {
        const messages = [
          {
            id: '11',
            role: 'assistant' as const,
            content: '| Header | Value |\n| --- | --- |\n| Name | Test |',
            timestamp: Date.now(),
          },
        ];

        render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);

        expect(document.querySelector('table')).not.toBeNull();
      });
    });
  });
});
