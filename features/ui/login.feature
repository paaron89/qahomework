Feature: Login
  As a user of the Angular Authentication app
  I want clear feedback when I sign in
  So that I know whether I am authenticated

  Scenario: Invalid credentials are rejected
    Given I am on the login page
    When I log in with invalid credentials
    Then I see the error "Ooops! Invalid username or password."
    And I remain on the login page

  Scenario: Valid credentials sign the user in
    Given I am on the login page
    When I log in as the admin user
    Then I land on the home page
    And the header avatar shows "AD"
