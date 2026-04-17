# Integrated File Explorer Specification

## Purpose
Replace mock file tree data in FileExplorer with real file system data from WebContainer, enabling users to see and interact with the actual files in their generated application.

## Requirements

### Requirement: FileExplorer MUST display real files from WebContainer
The system SHALL display files retrieved from WebContainerManager's file system, not hardcoded mock data.

#### Scenario: FileExplorer shows mounted files
- GIVEN WebContainer has mounted files from generated app
- WHEN FileExplorer component renders
- THEN it displays the actual file tree from WebContainer

#### Scenario: FileExplorer updates when files change
- GIVEN FileExplorer is displaying current files
- WHEN user generates new app with different files
- THEN FileExplorer updates to show new file tree

### Requirement: FileExplorer MUST show folder structure
The system SHALL display folders with expand/collapse functionality, mirroring the WebContainer file system hierarchy.

#### Scenario: Folder expands to show children
- GIVEN FileExplorer shows folder icon
- WHEN user clicks folder
- THEN folder expands to show child files and subfolders

#### Scenario: Folder collapses to hide children
- GIVEN folder is expanded showing children
- WHEN user clicks folder again
- THEN folder collapses and children are hidden

### Requirement: FileExplorer MUST handle empty state
The system SHALL display appropriate empty state when no files are mounted in WebContainer.

#### Scenario: No files mounted
- GIVEN WebContainer has no files mounted
- WHEN FileExplorer renders
- THEN it shows "No files" or empty state message

#### Scenario: FileExplorer handles WebContainer error
- GIVEN WebContainer throws error when reading files
- WHEN FileExplorer renders
- THEN it shows error state without crashing
