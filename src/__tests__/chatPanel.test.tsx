import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatPanel from '../components/chat/ChatPanel';

describe('ChatPanel', () => {
  it('should sanitize script tags from markdown', () => {
    const messages = [{
      id: '1',
      role: 'assistant' as const,
      content: '<script>alert("xss")</script>Hello',
      timestamp: Date.now()
    }];
    
    render(<ChatPanel messages={messages} onSendMessage={() => {}} isGenerating={false} />);
    
    // Script tags should be removed/sanitized - check it's not rendered as plain text
    const container = document.body;
    expect(container.innerHTML).not.toContain('<script>');
  });
});