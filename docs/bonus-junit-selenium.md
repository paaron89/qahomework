# JUnit + Selenium — Automating the "Delete Task" feature

## Which layer are we testing?

The current API suite (`features/api/tasks.feature`) tests **Delete a task by ID**
directly against the REST endpoint:

```gherkin
Scenario: Delete a task by ID
  Given an existing task id 1
  When I delete the task
  Then the response status is 200
  And the response body is empty
```

Selenium drives a **real browser**, so the equivalent Selenium + JUnit test
covers the same feature one layer up: a user opens the task list, clicks the
delete control on a task, confirms, and the task disappears from the UI. Pure
REST-level checks (status code, `GET` afterwards returns 404) are done with an
HTTP client such as `java.net.http.HttpClient` or REST Assured — Selenium has no
API assertions of its own.

---

## Approach

| Concern | Choice |
| --- | --- |
| Language / build | Java 17, Maven |
| Test runner | JUnit 5 (Jupiter) |
| Browser automation | Selenium 4 — `ChromeDriver`; Selenium Manager auto-resolves the driver binary |
| Design | Page Object Model — one `TasksPage`, no selectors in the test |
| Waiting | Explicit `WebDriverWait` + `ExpectedConditions`; **no `Thread.sleep`**, implicit waits disabled |
| Test data | The task to delete is **created via the API** in `@BeforeEach` (fast, deterministic, isolated), then deleted through the UI |
| Assertions | AssertJ (`assertThat(...)`) |
| Lifecycle | `@BeforeEach` starts a fresh browser + seeds data; `@AfterEach` quits the browser |

**Arrange–Act–Assert mapping**

- *Arrange* — create a uniquely-named task through the API and load the task page.
- *Act* — delete that task via the UI (`TasksPage.deleteTask`).
- *Assert* — the row is gone from the list, the count dropped by one, and
  (optionally) an API `GET` for that id now returns 404.

---

## Sample code

### `pom.xml` (dependencies)

```xml
<dependencies>
  <dependency>
    <groupId>org.seleniumhq.selenium</groupId>
    <artifactId>selenium-java</artifactId>
    <version>4.25.0</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.11.3</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.26.3</version>
    <scope>test</scope>
  </dependency>
</dependencies>
<!-- maven-surefire-plugin 3.x runs JUnit 5 automatically -->
```

### `TasksPage.java` — Page Object

```java
public class TasksPage {

    private static final By TASK_LIST   = By.cssSelector("[data-testid='task-list']");
    private static final By TASK_ROWS   = By.cssSelector("[data-testid='task-row']");
    private static final By DELETE_BTN  = By.cssSelector("[data-testid='delete-task']");
    private static final By CONFIRM_BTN = By.cssSelector("[data-testid='confirm-delete']");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public TasksPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    public TasksPage open(String baseUrl) {
        driver.get(baseUrl + "/tasks");
        wait.until(ExpectedConditions.visibilityOfElementLocated(TASK_LIST));
        return this;
    }

    public int taskCount() {
        return driver.findElements(TASK_ROWS).size();
    }

    public boolean hasTask(String title) {
        return findRow(title).isPresent();
    }

    public void deleteTask(String title) {
        WebElement row = findRow(title).orElseThrow(
                () -> new NoSuchElementException("Task not found in list: " + title));
        row.findElement(DELETE_BTN).click();
        wait.until(ExpectedConditions.elementToBeClickable(CONFIRM_BTN)).click();
        wait.until(ExpectedConditions.stalenessOf(row));   // row detached from DOM
    }

    private Optional<WebElement> findRow(String title) {
        return driver.findElements(TASK_ROWS).stream()
                .filter(r -> r.getText().contains(title))
                .findFirst();
    }
}
```

### `DeleteTaskTest.java` — JUnit 5 test

```java
class DeleteTaskTest {

    private static final String BASE_URL =
            System.getProperty("app.baseUrl", "http://localhost:4200");

    private WebDriver driver;
    private TasksPage tasksPage;
    private String taskTitle;
    private long taskId;

    @BeforeEach
    void setUp() {
        ChromeOptions options = new ChromeOptions();
        if (Boolean.getBoolean("headless")) {
            options.addArguments("--headless=new", "--window-size=1280,900");
        }
        driver = new ChromeDriver(options);                 // Selenium Manager fetches the driver
        driver.manage().timeouts().implicitlyWait(Duration.ZERO); // explicit waits only

        // Arrange: seed the task to delete through the API
        taskTitle = "Delete me " + UUID.randomUUID();
        taskId = TestApi.createTask(taskTitle);

        tasksPage = new TasksPage(driver).open(BASE_URL);
    }

    @Test
    void deletesTaskFromTheList() {
        assertThat(tasksPage.hasTask(taskTitle)).isTrue();
        int before = tasksPage.taskCount();

        tasksPage.deleteTask(taskTitle);

        assertThat(tasksPage.hasTask(taskTitle)).isFalse();
        assertThat(tasksPage.taskCount()).isEqualTo(before - 1);
        assertThat(TestApi.getTaskStatus(taskId)).isEqualTo(404); // gone server-side too
    }

    @Test
    void deletingLastTaskShowsEmptyState() {
        // (assumes a clean account with only the seeded task)
        tasksPage.deleteTask(taskTitle);
        assertThat(driver.findElements(By.cssSelector("[data-testid='empty-state']")))
                .isNotEmpty();
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
```

### `TestApi.java` — tiny HTTP helper (no Selenium involved)

```java
final class TestApi {

    private static final String API =
            System.getProperty("api.baseUrl", "https://jsonplaceholder.typicode.com");
    private static final HttpClient CLIENT = HttpClient.newHttpClient();

    static long createTask(String title) {
        // POST /todos  ->  201, body echoes the payload + an id
        HttpResponse<String> res = send("POST", "/todos",
                "{\"title\":\"" + title + "\",\"completed\":false,\"userId\":1}");
        assertThat(res.statusCode()).isEqualTo(201);
        return Long.parseLong(res.body().replaceAll(".*\"id\":\\s*(\\d+).*", "$1"));
    }

    static int getTaskStatus(long id) {
        return send("GET", "/todos/" + id, null).statusCode();
    }

    private static HttpResponse<String> send(String method, String path, String body) {
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder()
                    .uri(URI.create(API + path))
                    .header("Content-Type", "application/json");
            b.method(method, body == null
                    ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofString(body));
            return CLIENT.send(b.build(), HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

Run it: `mvn test -Dapp.baseUrl=http://localhost:4200 -Dheadless=true`

---

## How it maps to the current API test

| Current API suite (Playwright + playwright-bdd) | Selenium + JUnit equivalent |
| --- | --- |
| `Scenario: Delete a task by ID` in `features/api/tasks.feature` | `@Test deletesTaskFromTheList()` |
| `tasksApi.deleteTask(id)` → `HttpClient.delete()` | `TasksPage.deleteTask(title)` → `WebDriver` clicks |
| `expect(world.response.status).toBe(200)` | `assertThat(tasksPage.hasTask(title)).isFalse()` + `TestApi.getTaskStatus(id) == 404` |
| `expect(world.response.body).toEqual({})` | row `stalenessOf` + count decremented |
| Step definitions + `createBdd` fixtures | Page Object + `@BeforeEach`/`@AfterEach` |
| No browser (request fixture) | Real Chrome via `ChromeDriver` |
| `bddgen && playwright test` | `mvn test` |

---

## Playwright vs. Selenium + JUnit — short comparison

### Where the Playwright solution is better (and why it fits this repo)

- **Less flake, less boilerplate.** Playwright auto-waits on every action and its
  assertions retry (`expect(locator).toHaveText(...)`). The Selenium version
  needs explicit `WebDriverWait`/`ExpectedConditions` and `stalenessOf` handling
  by hand — more code, more chances to get a wait wrong.
- **One runner for UI *and* API.** This project tests both layers. Playwright
  does API calls with the built-in `request` fixture; Selenium is UI-only, so
  the Java stack needs a second library (REST Assured / `HttpClient`) bolted on —
  visible above in `TestApi`.
- **Batteries included.** Trace viewer, video, screenshot-on-failure, network
  interception/mocking, parallel workers and `--ui` mode ship out of the box.
  With Selenium each of those is a separate dependency or a Grid to run.
- **Version-matched browsers.** `npx playwright install` pins Chromium/Firefox/
  WebKit to the library version. Selenium 4's Selenium Manager narrowed this gap
  but still relies on whatever Chrome is on the machine.
- **Speed.** Playwright talks CDP directly; Selenium adds WebDriver protocol
  round-trips.
- **BDD stays first-class.** `playwright-bdd` keeps all runner features while
  reading `.feature` files. Cucumber-JVM works with Selenium but is a heavier
  integration.

### Where Selenium + JUnit is the better choice

- **Java-first organisation.** If the app, the CI, and the team's skills are all
  JVM (Spring, Maven/Gradle, existing JUnit suites), matching that stack lowers
  long-term maintenance cost more than any Playwright feature saves.
- **Browser and device breadth.** Selenium implements the W3C WebDriver standard
  with the widest real-browser and real-device coverage, a mature **Selenium
  Grid**, and strong support from cloud vendors (BrowserStack, Sauce Labs).
- **Mobile reuse.** Appium speaks the same WebDriver protocol, so page objects
  and helpers can be shared between web and native mobile tests.
- **Maturity and support.** Very large community, long track record, commercial
  support options — often a requirement in regulated/enterprise settings.

### Verdict for this project

**Playwright.** The suite already needs UI + API in a single runner, wants low
flake and Gherkin, and is JavaScript/TypeScript end to end. Introducing
Selenium + JUnit would add a second language and a second HTTP library for no
gain here. Selenium + JUnit becomes the right call when the surrounding
engineering org is Java-centric, or when large-scale cross-browser / real-device
testing via Grid is a hard requirement.
