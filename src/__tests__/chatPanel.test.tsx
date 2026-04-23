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
});
