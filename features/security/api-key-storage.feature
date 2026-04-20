Feature: API Key Storage Security
  As a user
  I want my API key to be stored securely
  So that my credentials are not exposed in client-side storage

  Background:
    Given the user has access to the settings interface
    And the application is running in a browser environment

  Scenario: API key is stored in memory only (not in sessionStorage)
    Given I have entered my API key in the settings field
    When I save the settings
    Then the API key should not be stored in sessionStorage
    And the API key should not be stored in localStorage

  Scenario: API key does not persist after page reload
    Given I have saved my API key
    When I reload the page
    Then the API key field should be empty
    And the user should be prompted to enter the API key again

  Scenario: API key is only sent to backend, never to third parties
    Given I have configured my API key
    When I make a request to generate an app
    Then the API key should be included in the request body
    And the API key should NOT be in URL query parameters

  Scenario: API key is masked in UI
    Given I have entered my API key
    When I view the settings page
    Then the API key should be displayed as masked characters (e.g., "••••••••")
    And a toggle button should allow showing/hiding the key