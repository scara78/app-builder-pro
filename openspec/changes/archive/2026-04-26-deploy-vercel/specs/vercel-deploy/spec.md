# Vercel Deploy Specification

## Purpose
One-click deployment of generated apps to Vercel. Reads files from WebContainer, prepares deployment payload, creates deployment via Vercel API, and returns live URL.

## Requirements

### Requirement: Deploy Pipeline Execution
The system SHALL execute a 4-stage deploy pipeline: PREPARING → DEPLOYING → WAITING → COMPLETE. Each stage MUST emit progress updates (0-100%).

#### Scenario: Successful deployment flow
- GIVEN user has authenticated with Vercel AND generated code exists in WebContainer
- WHEN user clicks "Deploy" button
- THEN pipeline transitions through PREPARING (reading + encoding files) → DEPLOYING (POST /v13/deployments) → WAITING (polling status) → COMPLETE (URL available)
- AND each transition updates progress percentage

#### Scenario: Deployment fails at DEPLOYING stage
- GIVEN Vercel API returns error on POST /v13/deployments
- WHEN pipeline is at DEPLOYING stage
- THEN pipeline enters ERROR state with API error message
- AND retry option is presented

### Requirement: File Preparation from WebContainer
The system SHALL read all project files from WebContainer, exclude `node_modules/`, `.git/`, `dist/`, and encode each file as base64 for the Vercel deployment payload.

#### Scenario: Files encoded for deployment
- GIVEN WebContainer contains project files
- WHEN file preparation runs
- THEN each file is read and base64-encoded with `encoding: "base64"` and `file` path relative to project root
- AND excluded paths are filtered out

#### Scenario: Empty project cannot deploy
- GIVEN WebContainer has no project files
- WHEN deploy is attempted
- THEN pipeline enters ERROR state with "No files to deploy" message

### Requirement: Vercel Deployment API Call
The system SHALL create a deployment via `POST /v13/deployments` with Bearer token, project name, and base64-encoded files array. The `target` MUST be "production".

#### Scenario: Deployment request sent
- GIVEN files are prepared and token is valid
- WHEN POST /v13/deployments is called
- THEN request includes `Authorization: Bearer {token}`, `name`, `target: "production"`, and `files` array
- AND response contains deployment `id` and `url`

### Requirement: Deployment Status Polling
The system SHALL poll `GET /v13/deployments/{id}` at intervals until the deployment state is `READY` or `ERROR`. Polling interval SHOULD be 2 seconds. Max poll duration MUST be 5 minutes.

#### Scenario: Deployment becomes ready
- GIVEN deployment is created and `id` is returned
- WHEN poll returns `state: "READY"`
- THEN pipeline enters COMPLETE state with deployment URL

#### Scenario: Deployment polling timeout
- GIVEN deployment has not reached READY state
- WHEN 5 minutes have elapsed
- THEN pipeline enters ERROR state with "Deployment timed out" message

#### Scenario: Deployment fails on Vercel side
- GIVEN poll returns `state: "ERROR"`
- THEN pipeline enters ERROR state with Vercel error message

### Requirement: Deploy URL Display
The system SHALL display the deployment URL to the user upon completion with a copy-to-clipboard button. The URL MUST be clickable (opens in new tab).

#### Scenario: User receives deploy URL
- GIVEN pipeline is in COMPLETE state
- THEN DeploySuccess component shows live URL
- AND URL is clickable (target="_blank")
- AND copy button copies URL to clipboard
