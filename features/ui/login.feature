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

  # ---------------------------------------------------------------------------
  # Further checks worth adding (notes only, not yet automated):
  #
  #   * Empty fields: submit with username and password both blank -> Login
  #     button stays disabled / inline "required" validation, no request sent.
  #   * One field empty: only username, or only password -> same validation,
  #     no submission.
  #   * Whitespace-only input: "   " in either field is treated as empty.
  #   * SQL injection payloads: e.g. ' OR '1'='1  /  admin'--  in username and
  #     password -> rejected as normal invalid credentials ("Ooops! Invalid
  #     username or password."), never logs in, no 500, no SQL error leaked.
  #   * XSS payloads: <script>alert(1)</script> in the username -> rendered as
  #     text in the error, not executed.
  #   * Trimming / case sensitivity of the username.
  #   * Password field masks input and is excluded from autocomplete where required.
  #   * Rate limiting / lockout after repeated failed attempts.
  #   * Max-length handling for very long input strings.
  # ---------------------------------------------------------------------------
