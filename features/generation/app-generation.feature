Feature: App Generation
  As a user
  I want to generate a complete application from a prompt
  So that I can quickly deploy my ideas to production

  Scenario: User generates a simple React app
    Given I have entered a prompt describing my app
    When I submit the prompt to generate the app
    Then the system should analyze the requirements
    And the system should generate the application files
    And the system should return a success response with generated artifacts

  Scenario: Generation fails due to invalid API key
    Given I have entered a valid prompt
    And my API key is missing or invalid
    When I submit the prompt to generate the app
    Then the system should return an error
    And the error message should indicate authentication failure

  Scenario: Generation is retried after temporary failure
    Given I submitted a prompt that temporarily failed
    When I retry the generation request
    Then the system should attempt to generate the app again
    And if successful, return the generated artifacts

  Scenario: Generation succeeds on third attempt after retries
    Given I submitted a prompt that failed twice
    When the retry mechanism succeeds on the third attempt
    Then I should receive the generated application
    And the confidence score should be included in the response