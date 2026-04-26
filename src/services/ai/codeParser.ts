import { type ProjectFile } from '../../types';

export interface ParseResult {
  message: string;
  files: ProjectFile[];
  warnings: string[]; // empty array if no issues
}

export function parseAIResponse(text: string): ParseResult {
  const warnings: string[] = [];
  const files: ProjectFile[] = [];
  const lines = text.split('\n');
  let currentFile: string | null = null;
  let currentContent: string[] = [];
  let isInsideCodeBlock = false;
  let messageLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect file marker: "File: path/to/file.ext"
    if (line.trim().startsWith('File:')) {
      // Save previous file if exists
      if (currentFile && currentContent.length > 0) {
        files.push({
          path: currentFile,
          content: currentContent.join('\n').trim(),
        });
      }
      currentFile = line.replace('File:', '').trim();
      currentContent = [];
      continue;
    }

    if (line.trim().startsWith('```')) {
      isInsideCodeBlock = !isInsideCodeBlock;
      continue;
    }

    if (currentFile && isInsideCodeBlock) {
      currentContent.push(line);
    } else if (!currentFile && !isInsideCodeBlock) {
      messageLines.push(line);
    }
  }

  // Last file
  if (currentFile && currentContent.length > 0) {
    files.push({
      path: currentFile,
      content: currentContent.join('\n').trim(),
    });
  }

  // Spec-compliant validations for warnings (SEC-CP)

  // SEC-CP-001: Missing file markers
  if (files.length === 0) {
    warnings.push('Missing file markers in response');
  }

  // SEC-CP-008: Invalid/short file paths — per-file warning with path
  const emptyPaths = files.filter((f) => !f.path || f.path.length < 5);
  emptyPaths.forEach((f) => {
    warnings.push(`Invalid file path: ${f.path || '(empty)'}`);
  });

  // SEC-CP-002: Detect unclosed code blocks — count standalone ``` lines (including ```language)
  const backtickLineCount = lines.filter((l) => /^\s*```\S*\s*$/.test(l)).length;
  if (backtickLineCount % 2 !== 0) {
    warnings.push('Unclosed code block detected');
  }

  // SEC-CP-003: Detect empty file content — file with File marker but content is only whitespace
  const emptyContentFiles = files.filter((f) => !f.content || f.content.trim().length === 0);
  emptyContentFiles.forEach((f) => {
    warnings.push(`Empty file content for: ${f.path}`);
  });

  // Note: short explanation message warning REMOVED — not in spec.
  // SEC-CP-004/007: valid input (proper markers + closed blocks) should return warnings: []

  const message = messageLines.join('\n').trim();

  return {
    message,
    files,
    warnings,
  };
}
