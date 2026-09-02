Feature: Task management API
  As an API consumer
  I want to create, read, update and delete tasks over REST
  So that task data stays consistent

  Background:
    Given the Task API is reachable

  # POST /tasks - Create a new task
  Scenario: Create a new task
    Given a new task payload
    When I create the task
    Then the response status is 201
    And the response is JSON
    And the response body has a numeric id
    And the response time is under 3000 ms

  # GET /tasks/{id} - Retrieve a task by ID
  Scenario: Retrieve a task by ID
    Given an existing task id 1
    When I request the task by id
    Then the response status is 200
    And the response is JSON
    And the response body matches the task schema
    And the response body has id 1

  # GET /tasks/{id} - unknown id
  Scenario: Retrieving a non-existent task returns 404
    Given a non-existent task id 999999
    When I request the task by id
    Then the response status is 404
    And the response body is empty

  # PUT /tasks/{id} - Update a task by ID
  Scenario: Update a task by ID
    Given an existing task id 1
    And a task payload with title "Updated task title" and completed "true"
    When I update the task
    Then the response status is 200
    And the response body has id 1
    And the response body has title "Updated task title"
    And the response body has completed "true"

  # DELETE /tasks/{id} - Delete a task by ID
  Scenario: Delete a task by ID
    Given an existing task id 1
    When I delete the task
    Then the response status is 200
    And the response body is empty
