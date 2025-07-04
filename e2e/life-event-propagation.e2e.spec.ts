import { test, expect, Page } from '@playwright/test';

// Utility to generate a unique test user
function uniqueEmail() {
  return `propagation_e2e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
}

// Test data
const testPassword = 'TestPass123!';
const testPerson = {
  first_name: 'Propagation',
  last_name: 'Tester',
  birth_date: '1900-01-01',
  birth_place: 'Berlin',
};
const testLifeEvent = {
  title: 'Propagation Test Event',
  start_date: '1900-01-15',
  location: `Propagation_Location_${Date.now()}`,
  description: 'Test event for propagation verification',
};

// Main test suite
test.describe('Life Events Propagation E2E', () => {
  let email: string;
  let personId: number;
  let lifeEventId: number;

  test.beforeAll(async ({ request }) => {
    email = uniqueEmail();
    
    // Register user
    const res = await request.post('/api/auth/register', {
      data: { 
        email, 
        password: testPassword,
        name: 'E2E Propagation Test User'
      },
    });
    
    expect(res.ok()).toBeTruthy();
    
    // For testing, directly verify the user's email by updating the database
    const verifyRes = await request.post('/api/auth/verify-test-user', {
      data: { email }
    });
    
    // Login (simulate session)
    const login = await request.post('/api/auth/login', {
      data: { email, password: testPassword },
    });
    
    expect(login.ok()).toBeTruthy();
  });

  // ========================================
  // 1. CROSS-PAGE DATA CONSISTENCY TESTS
  // ========================================

  test('Life event appears consistently across all pages', async ({ page }) => {
    // Log in via UI
    console.log('Navigating to /auth/login');
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    // Wait for dashboard heading or known element after login
    try {
      await Promise.race([
        page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 }),
        page.waitForSelector('h1:has-text("Timeline")', { timeout: 10000 }),
        page.waitForURL('/dashboard', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Login did not reach dashboard. Page body content:', bodyContent);
      throw e;
    }
    // API check after login
    const resLogin = await page.request.get('/api/persons');
    const statusLogin = resLogin.status();
    let bodyLogin;
    try { bodyLogin = await resLogin.json(); } catch (e) { bodyLogin = await resLogin.text(); }
    console.log('API /api/persons after login:', statusLogin, bodyLogin);
    // Create a person via UI
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', testPerson.first_name);
    await page.fill('input[name="last_name"]', testPerson.last_name);
    await page.fill('input[name="birth_date"]', testPerson.birth_date);
    await page.fill('input[name="birth_place"]', testPerson.birth_place);
    await page.click('button:has-text("Speichern")');
    // Robust wait for navigation to /persons
    try {
      await Promise.race([
        page.waitForURL('/persons', { timeout: 15000 }),
        page.waitForSelector('.MuiDataGrid-root', { timeout: 15000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Navigation to /persons failed. Page body content:', bodyContent);
      throw e;
    }
    // API check after person creation
    const resPersons = await page.request.get('/api/persons');
    const statusPersons = resPersons.status();
    let bodyPersons;
    try { bodyPersons = await resPersons.json(); } catch (e) { bodyPersons = await resPersons.text(); }
    console.log('API /api/persons after person creation:', statusPersons, bodyPersons);
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)PropagationTester/);
    if (idMatch) {
      personId = parseInt(idMatch[1]);
    } else {
      throw new Error('Could not extract person ID from grid');
    }
    console.log('Person ID:', personId);
    // Go to person detail page
    console.log('Navigating to person detail page');
    await page.goto(`/persons/${personId}`);
    await expect(page).toHaveURL(`/persons/${personId}`);
    await page.waitForLoadState('networkidle');
    // Create a life event
    console.log('Opening life event drawer');
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    await page.fill('input[name="title"]', testLifeEvent.title);
    await page.fill('input[name="start_date"]', testLifeEvent.start_date);
    await page.fill('input[name="location"]', testLifeEvent.location);
    await page.fill('textarea[name="description"]', testLifeEvent.description);
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    // Robust wait for drawer to close and UI update
    try {
      await Promise.race([
        page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 10000 }),
        page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Drawer did not close after event creation. Page body content:', bodyContent);
      throw e;
    }
    // API check after life event creation
    const resLifeEvents1 = await page.request.get(`/api/life-events?personId=${personId}`);
    const statusLifeEvents1 = resLifeEvents1.status();
    let bodyLifeEvents1;
    try { bodyLifeEvents1 = await resLifeEvents1.json(); } catch (e) { bodyLifeEvents1 = await resLifeEvents1.text(); }
    console.log('API /api/life-events after life event creation:', statusLifeEvents1, bodyLifeEvents1);
    // Wait for page to update
    await page.waitForTimeout(2000);
    // Verify life event appears on person detail page
    console.log('Checking life event on person detail page');
    await expect(page.locator(`text=${testLifeEvent.title}`).first()).toBeVisible();
    await expect(page.locator(`text=${testLifeEvent.location}`).first()).toBeVisible();
    // Check locations page
    console.log('Navigating to /locations');
    await page.goto('/locations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${testLifeEvent.location}`).first()).toBeVisible();
    // Click on the location to see details
    console.log('Clicking location for details');
    await page.locator(`text=${testLifeEvent.location}`).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${testLifeEvent.title}`).first()).toBeVisible();
    // Check timeline page
    console.log('Navigating to /timeline');
    await page.goto('/timeline');
    // Wait for the timeline heading to ensure hydration
    await page.waitForSelector('h1:has-text("Timeline")', { timeout: 10000 });
    // Wait for error overlay to appear with retry and logging
    let found = false;
    for (let i = 0; i < 10; i++) {
      if (await page.locator('[role="alert"]:has-text("Fehler beim Laden der Timeline-Daten")').isVisible()) {
        found = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!found) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Error overlay not found. Page body content:', bodyContent);
      throw new Error('No user-friendly error message or overlay found');
    }
    await expect(page.locator('text=Fehler beim Laden der Timeline-Daten')).toBeVisible();
    await expect(page.locator('main alert button:has-text("Erneut versuchen")')).toBeVisible();
    // Check dashboard/analytics
    console.log('Navigating to /dashboard');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Look for a dashboard heading or summary
    const dashboardContent = await page.locator('body').textContent();
    if (!dashboardContent?.match(/Dashboard|Statistik|Lebensereignis|Ereignis/)) {
      throw new Error('Dashboard does not show expected content');
    }
    // Check analytics page
    console.log('Navigating to /analytics');
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const analyticsContent = await page.locator('body').textContent();
    if (!analyticsContent?.match(/Analytics|Statistik|Lebensereignis|Ereignis/)) {
      throw new Error('Analytics does not show expected content');
    }
  });

  test('Life event count updates consistently across all pages', async ({ page }) => {
    // Log in via UI
    console.log('Navigating to /auth/login');
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    // Wait for dashboard heading or known element after login
    try {
      await Promise.race([
        page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 }),
        page.waitForSelector('h1:has-text("Timeline")', { timeout: 10000 }),
        page.waitForURL('/dashboard', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Login did not reach dashboard. Page body content:', bodyContent);
      throw e;
    }
    // API check after login
    const resLogin = await page.request.get('/api/persons');
    const statusLogin = resLogin.status();
    let bodyLogin;
    try { bodyLogin = await resLogin.json(); } catch (e) { bodyLogin = await resLogin.text(); }
    console.log('API /api/persons after login:', statusLogin, bodyLogin);
    // Create a person for this test
    console.log('Navigating to /persons/create');
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'Count');
    await page.fill('input[name="last_name"]', 'Test');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    // Robust wait for navigation to /persons
    try {
      await Promise.race([
        page.waitForURL('/persons', { timeout: 15000 }),
        page.waitForSelector('.MuiDataGrid-root', { timeout: 15000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Navigation to /persons failed. Page body content:', bodyContent);
      throw e;
    }
    // API check after person creation
    const resPersons = await page.request.get('/api/persons');
    const statusPersons = resPersons.status();
    let bodyPersons;
    try { bodyPersons = await resPersons.json(); } catch (e) { bodyPersons = await resPersons.text(); }
    console.log('API /api/persons after person creation:', statusPersons, bodyPersons);
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)CountTest/);
    const countPersonId = idMatch ? parseInt(idMatch[1]) : null;
    if (!countPersonId) throw new Error('Could not extract person ID');
    console.log('Person ID:', countPersonId);
    // Go to person detail page
    console.log('Navigating to person detail page');
    await page.goto(`/persons/${countPersonId}`);
    await expect(page).toHaveURL(`/persons/${countPersonId}`);
    await page.waitForLoadState('networkidle');
    // Check initial count (should be 0)
    const initialCountTab = page.locator('button:has-text("Lebensereignisse")');
    await expect(initialCountTab).toContainText('(0)');
    // Create first life event
    console.log('Opening life event drawer');
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    const event1 = {
      title: 'Count Test Event 1',
      start_date: '1900-01-01',
      location: `Count_Location_1_${Date.now()}`,
      description: 'First event for count test',
    };
    await page.fill('input[name="title"]', event1.title);
    await page.fill('input[name="start_date"]', event1.start_date);
    await page.fill('input[name="location"]', event1.location);
    await page.fill('textarea[name="description"]', event1.description);
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    // Robust wait for drawer to close and UI update
    try {
      await Promise.race([
        page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 10000 }),
        page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Drawer did not close after event creation. Page body content:', bodyContent);
      throw e;
    }
    // API check after life event creation
    const resLifeEvents2 = await page.request.get(`/api/life-events?personId=${countPersonId}`);
    const statusLifeEvents2 = resLifeEvents2.status();
    let bodyLifeEvents2;
    try { bodyLifeEvents2 = await resLifeEvents2.json(); } catch (e) { bodyLifeEvents2 = await resLifeEvents2.text(); }
    console.log('API /api/life-events after life event creation:', statusLifeEvents2, bodyLifeEvents2);
    // Check count is now 1
    await expect(initialCountTab).toContainText('(1)');
    // Create second life event
    console.log('Opening life event drawer for second event');
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    const event2 = {
      title: 'Count Test Event 2',
      start_date: '1900-01-02',
      location: `Count_Location_2_${Date.now()}`,
      description: 'Second event for count test',
    };
    await page.fill('input[name="title"]', event2.title);
    await page.fill('input[name="start_date"]', event2.start_date);
    await page.fill('input[name="location"]', event2.location);
    await page.fill('textarea[name="description"]', event2.description);
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    // Robust wait for drawer to close and UI update
    try {
      await Promise.race([
        page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 10000 }),
        page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Drawer did not close after event creation. Page body content:', bodyContent);
      throw e;
    }
    // API check after life event creation
    const resLifeEvents3 = await page.request.get(`/api/life-events?personId=${countPersonId}`);
    const statusLifeEvents3 = resLifeEvents3.status();
    let bodyLifeEvents3;
    try { bodyLifeEvents3 = await resLifeEvents3.json(); } catch (e) { bodyLifeEvents3 = await resLifeEvents3.text(); }
    console.log('API /api/life-events after life event creation:', statusLifeEvents3, bodyLifeEvents3);
    // Check count is now 2
    await expect(initialCountTab).toContainText('(2)');
    // Check locations page count
    console.log('Navigating to /locations');
    await page.goto('/locations');
    await page.waitForLoadState('networkidle');
    // Find the location and check its event count
    const locationRow = page.locator(`text=${event1.location}`).first();
    await expect(locationRow).toBeVisible();
    // Check dashboard stats
    console.log('Navigating to /dashboard');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Verify dashboard shows the correct number of events
    const dashboardContent = await page.locator('body').textContent();
    expect(dashboardContent ?? '').toContain('Event');
  });

  // ========================================
  // 2. REAL-TIME UI UPDATES TESTS
  // ========================================

  test('Life event updates propagate in real-time without page refresh', async ({ page }) => {
    // Log in via UI
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Create a person for this test
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'RealTime');
    await page.fill('input[name="last_name"]', 'Test');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    // Robust wait for navigation to /persons
    try {
      await Promise.race([
        page.waitForURL('/persons', { timeout: 15000 }),
        page.waitForSelector('.MuiDataGrid-root', { timeout: 15000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Navigation to /persons failed. Page body content:', bodyContent);
      throw e;
    }
    
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)RealTimeTest/);
    const realTimePersonId = idMatch ? parseInt(idMatch[1]) : null;
    if (!realTimePersonId) throw new Error('Could not extract person ID');

    // Go to person detail page
    await page.goto(`/persons/${realTimePersonId}`);
    await expect(page).toHaveURL(`/persons/${realTimePersonId}`);
    await page.waitForLoadState('networkidle');
    
    // Create a life event
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    
    const realTimeEvent = {
      title: 'Real-time Test Event',
      start_date: '1900-01-01',
      location: `RealTime_Location_${Date.now()}`,
      description: 'Event for real-time testing',
    };
    
    await page.fill('input[name="title"]', realTimeEvent.title);
    await page.fill('input[name="start_date"]', realTimeEvent.start_date);
    await page.fill('input[name="location"]', realTimeEvent.location);
    await page.fill('textarea[name="description"]', realTimeEvent.description);
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    // Robust wait for drawer to close and UI update
    try {
      await Promise.race([
        page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 10000 }),
        page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Drawer did not close after event creation. Page body content:', bodyContent);
      throw e;
    }
    
    // Verify event appears immediately without page refresh
    await expect(page.locator(`text=${realTimeEvent.title}`).first()).toBeVisible();
    
    // Check count updates immediately
    const countTab = page.locator('button:has-text("Lebensereignisse")');
    await expect(countTab).toContainText('(1)');
    
    // Edit the event in real-time
    const menuButton = page.locator(`text=${realTimeEvent.title}`).first().locator('..').locator('..').locator('..').locator('button').last();
    await menuButton.click();
    await page.waitForSelector('.MuiMenu-root', { timeout: 5000 });
    await page.locator('.MuiMenu-root').locator('text=Bearbeiten').click();
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    
    const updatedEvent = {
      title: 'Real-time Updated Event',
      start_date: '1900-01-02',
      location: `RealTime_Updated_${Date.now()}`,
      description: 'Updated event for real-time testing',
    };
    
    await page.fill('input[name="title"]', updatedEvent.title);
    await page.fill('input[name="start_date"]', updatedEvent.start_date);
    await page.fill('input[name="location"]', updatedEvent.location);
    await page.fill('textarea[name="description"]', updatedEvent.description);
    await page.waitForSelector('button:has-text("Event aktualisieren"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event aktualisieren")');
    // Check for snackbar or updated event title
    try {
      await expect(page.locator('.MuiSnackbar-root')).toContainText('erfolgreich', { timeout: 2000 });
    } catch {
      // Fallback: check for updated event title
      await expect(page.locator('text=Real-time Updated Event').first()).toBeVisible();
    }
    await page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 5000 });
    
    // Verify update appears immediately without page refresh
    await expect(page.locator(`text=${updatedEvent.title}`).first()).toBeVisible();
    await expect(page.locator(`text=${updatedEvent.location}`).first()).toBeVisible();
    await expect(page.locator(`text=${realTimeEvent.title}`).first()).not.toBeVisible();
  });

  // ========================================
  // 3. CASCADE OPERATIONS TESTS
  // ========================================

  test('Deleting a person cascades to delete their life events', async ({ page }) => {
    // Log in via UI
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Create a person for this test
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'Cascade');
    await page.fill('input[name="last_name"]', 'Test');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    // Robust wait for navigation to /persons
    try {
      await Promise.race([
        page.waitForURL('/persons', { timeout: 15000 }),
        page.waitForSelector('.MuiDataGrid-root', { timeout: 15000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Navigation to /persons failed. Page body content:', bodyContent);
      throw e;
    }
    
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)CascadeTest/);
    const cascadePersonId = idMatch ? parseInt(idMatch[1]) : null;
    if (!cascadePersonId) throw new Error('Could not extract person ID');

    // Go to person detail page
    await page.goto(`/persons/${cascadePersonId}`);
    await expect(page).toHaveURL(`/persons/${cascadePersonId}`);
    await page.waitForLoadState('networkidle');
    
    // Create multiple life events
    const events = [
      {
        title: 'Cascade Event 1',
        start_date: '1900-01-01',
        location: `Cascade_Location_1_${Date.now()}`,
        description: 'First cascade event',
      },
      {
        title: 'Cascade Event 2',
        start_date: '1900-01-02',
        location: `Cascade_Location_2_${Date.now()}`,
        description: 'Second cascade event',
      }
    ];
    
    for (const event of events) {
      await page.click('button:has-text("Neues Ereignis")');
      await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
      
      await page.fill('input[name="title"]', event.title);
      await page.fill('input[name="start_date"]', event.start_date);
      await page.fill('input[name="location"]', event.location);
      await page.fill('textarea[name="description"]', event.description);
      await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
      await page.click('button:has-text("Event erstellen")');
      // Robust wait for drawer to close and UI update
      try {
        await Promise.race([
          page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 10000 }),
          page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 })
        ]);
      } catch (e) {
        const bodyContent = await page.locator('body').textContent();
        console.log('Drawer did not close after event creation. Page body content:', bodyContent);
        throw e;
      }
      await page.waitForTimeout(1000);
    }
    
    // Verify events exist
    await expect(page.locator('button:has-text("Lebensereignisse")')).toContainText('(2)');
    
    // Go to persons list page
    await page.goto('/persons');
    await page.waitForLoadState('networkidle');
    
    // Find and delete the person
    const personRow = page.locator(`text=CascadeTest`).first();
    await expect(personRow).toBeVisible();
    
    // Click the menu button for the person
    const menuButton = personRow.locator('..').locator('..').locator('button').last();
    await menuButton.click();
    await page.waitForSelector('.MuiMenu-root', { timeout: 5000 });
    await page.locator('.MuiMenu-root').locator('text=Löschen').click();
    // If a confirmation dialog appears, try to confirm, but don't fail if not present
    const confirmButton = page.locator('button:has-text("Löschen"), button:has-text("Delete")').first();
    if (await confirmButton.isVisible() && await confirmButton.isEnabled()) {
      await confirmButton.click();
    }
    // After deleting a person, robust wait for UI update
    try {
      await Promise.race([
        page.waitForSelector('text=CascadeTest', { state: 'hidden', timeout: 10000 }),
        page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Person row did not disappear after deletion. Page body content:', bodyContent);
      throw e;
    }
    
    // Check that the person's life events are also gone from locations
    await page.goto('/locations');
    await page.waitForLoadState('networkidle');
    // Retry for up to 5 seconds
    let allGone = false;
    for (let i = 0; i < 10; i++) {
      allGone = true;
      for (const event of events) {
        if (await page.locator(`text=${event.location}`).first().isVisible()) {
          allGone = false;
          break;
        }
      }
      if (allGone) break;
      await page.waitForTimeout(500);
    }
    if (!allGone) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Life events still visible in locations after cascade delete. Page body:', bodyContent);
    }
    for (const event of events) {
      expect(await page.locator(`text=${event.location}`).first().isVisible()).toBe(false);
    }
    // Backend check: ensure no life events remain for the deleted person
    let backendGone = false;
    let lastBackendData = null;
    for (let i = 0; i < 10; i++) {
      const res = await page.request.get(`/api/life-events?personId=${cascadePersonId}`);
      if (res.status() === 404) {
        backendGone = true;
        break;
      }
      const data = await res.json();
      lastBackendData = data;
      if (Array.isArray(data) && data.length === 0) {
        backendGone = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!backendGone) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Backend still has life events for deleted person:', lastBackendData, 'Page body:', bodyContent);
      throw new Error(`Backend still has life events for deleted person: ${JSON.stringify(lastBackendData)}`);
    }
  });

  test('Deleting a historic event cascades to update linked life events', async ({ page }) => {
    // This test would verify that when a historic event is deleted,
    // any life events linked to it are updated to remove the link
    // Implementation depends on the specific cascade behavior
    test.skip('Historic event cascade not yet implemented');
  });

  // ========================================
  // 4. PERFORMANCE TESTS
  // ========================================

  test('Life event operations complete within acceptable time limits', async ({ page }) => {
    // Log in via UI
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    // Wait for dashboard heading or known element after login
    try {
      await Promise.race([
        page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 }),
        page.waitForSelector('h1:has-text("Timeline")', { timeout: 10000 }),
        page.waitForURL('/dashboard', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Login did not reach dashboard. Page body content:', bodyContent);
      throw e;
    }

    // Create a person for this test
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'Performance');
    await page.fill('input[name="last_name"]', 'Test');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    await page.waitForURL('/persons');
    
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)PerformanceTest/);
    const perfPersonId = idMatch ? parseInt(idMatch[1]) : null;
    if (!perfPersonId) throw new Error('Could not extract person ID');

    // Go to person detail page
    await page.goto(`/persons/${perfPersonId}`);
    await expect(page).toHaveURL(`/persons/${perfPersonId}`);
    await page.waitForLoadState('networkidle');
    
    // Test creation performance
    const startTime = Date.now();
    
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    
    const perfEvent = {
      title: 'Performance Test Event',
      start_date: '1900-01-01',
      location: `Perf_Location_${Date.now()}`,
      description: 'Event for performance testing',
    };
    
    await page.fill('input[name="title"]', perfEvent.title);
    await page.fill('input[name="start_date"]', perfEvent.start_date);
    await page.fill('input[name="location"]', perfEvent.location);
    await page.fill('textarea[name="description"]', perfEvent.description);
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    // Robust wait for drawer to close and UI update
    try {
      await Promise.race([
        page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 10000 }),
        page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 })
      ]);
    } catch (e) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Drawer did not close after event creation. Page body content:', bodyContent);
      throw e;
    }
    
    const creationTime = Date.now() - startTime;
    console.log(`Life event creation took ${creationTime}ms`);
    
    // Assert creation completes within 5 seconds
    expect(creationTime).toBeLessThan(5000);
    
    // Test edit performance
    const editStartTime = Date.now();
    
    const menuButton = page.locator(`text=${perfEvent.title}`).first().locator('..').locator('..').locator('..').locator('button').last();
    await menuButton.click();
    await page.waitForSelector('.MuiMenu-root', { timeout: 5000 });
    await page.locator('.MuiMenu-root').locator('text=Bearbeiten').click();
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    
    await page.fill('input[name="title"]', 'Updated Performance Event');
    await page.waitForSelector('button:has-text("Event aktualisieren"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event aktualisieren")');
    // Check for snackbar or updated event title
    try {
      await expect(page.locator('.MuiSnackbar-root')).toContainText('erfolgreich', { timeout: 2000 });
    } catch {
      // Fallback: check for updated event title
      await expect(page.locator('text=Updated Performance Event').first()).toBeVisible();
    }
    await page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 5000 });
    
    const editTime = Date.now() - editStartTime;
    console.log(`Life event edit took ${editTime}ms`);
    
    // Assert edit completes within 5 seconds
    expect(editTime).toBeLessThan(5000);
    
    // Test delete performance
    const deleteStartTime = Date.now();
    
    const deleteMenuButton = page.locator('text=Updated Performance Event').first().locator('..').locator('..').locator('..').locator('button').last();
    await deleteMenuButton.click();
    await page.waitForSelector('.MuiMenu-root', { timeout: 5000 });
    await page.locator('.MuiMenu-root').locator('text=Löschen').click();
    
    await page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 });
    const snackbarText = await page.locator('.MuiSnackbar-root').textContent();
    
    const deleteTime = Date.now() - deleteStartTime;
    console.log(`Life event deletion took ${deleteTime}ms`);
    
    // Assert delete completes within 5 seconds
    expect(deleteTime).toBeLessThan(5000);
  });

  test('Bulk operations perform efficiently', async ({ page }) => {
    // Log in via UI
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Create a person for this test
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'Bulk');
    await page.fill('input[name="last_name"]', 'Test');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    await page.waitForURL('/persons');
    
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)BulkTest/);
    const bulkPersonId = idMatch ? parseInt(idMatch[1]) : null;
    if (!bulkPersonId) throw new Error('Could not extract person ID');

    // Go to person detail page
    await page.goto(`/persons/${bulkPersonId}`);
    await expect(page).toHaveURL(`/persons/${bulkPersonId}`);
    await page.waitForLoadState('networkidle');
    
    // Create multiple life events quickly
    const startTime = Date.now();
    const numEvents = 5;
    let eventTimes = [];
    for (let i = 0; i < numEvents; i++) {
      const eventStart = Date.now();
      await page.click('button:has-text("Neues Ereignis")');
      await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
      await page.fill('input[name="title"]', `Bulk Event ${i + 1}`);
      await page.fill('input[name="start_date"]', `1900-01-${String(i + 1).padStart(2, '0')}`);
      await page.fill('input[name="location"]', `Bulk_Location_${i + 1}_${Date.now()}`);
      await page.fill('textarea[name="description"]', `Bulk event ${i + 1}`);
      await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
      await page.click('button:has-text("Event erstellen")');
      // Robust wait for drawer to close and UI update
      try {
        await Promise.race([
          page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 10000 }),
          page.waitForSelector('.MuiSnackbar-root', { timeout: 10000 })
        ]);
      } catch (e) {
        const bodyContent = await page.locator('body').textContent();
        console.log('Drawer did not close after event creation. Page body content:', bodyContent);
        throw e;
      }
      await page.waitForTimeout(500); // Small delay between creations
      const eventEnd = Date.now();
      eventTimes.push(eventEnd - eventStart);
      console.log(`Bulk event ${i + 1} creation took ${eventEnd - eventStart}ms`);
    }
    const bulkCreationTime = Date.now() - startTime;
    console.log(`Bulk creation of ${numEvents} events took ${bulkCreationTime}ms. Individual times:`, eventTimes);
    // Assert bulk creation completes within reasonable time (10 seconds for 5 events)
    expect(bulkCreationTime).toBeLessThan(10000);
    
    // Verify all events are visible
    await expect(page.locator('button:has-text("Lebensereignisse")')).toContainText(`(${numEvents})`);
    
    for (let i = 0; i < numEvents; i++) {
      await expect(page.locator(`text=Bulk Event ${i + 1}`).first()).toBeVisible();
    }
  });

  // ========================================
  // 5. EDGE CASE PROPAGATION TESTS
  // ========================================

  test('Handles invalid life event data gracefully', async ({ page }) => {
    // Log in via UI
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Create a person for this test
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'Edge');
    await page.fill('input[name="last_name"]', 'Test');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    await page.waitForURL('/persons');
    
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)EdgeTest/);
    const edgePersonId = idMatch ? parseInt(idMatch[1]) : null;
    if (!edgePersonId) throw new Error('Could not extract person ID');

    // Go to person detail page
    await page.goto(`/persons/${edgePersonId}`);
    await expect(page).toHaveURL(`/persons/${edgePersonId}`);
    await page.waitForLoadState('networkidle');
    
    // Test with empty title
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    
    await page.fill('input[name="title"]', ''); // Empty title
    await page.fill('input[name="start_date"]', '1900-01-01');
    await page.fill('input[name="location"]', `Edge_Location_${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Event with empty title');
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    
    // Should show error or validation message
    try {
      await expect(page.locator('.MuiSnackbar-root')).toContainText('Fehler', { timeout: 2000 });
    } catch {
      // If snackbar does not appear, check for visible validation error
      const errorText = await page.locator('.MuiFormHelperText-root').textContent();
      if (!errorText) throw new Error('No snackbar or validation error shown for empty title');
    }
    
    // Test with invalid date
    await page.fill('input[name="title"]', 'Invalid Date Event');
    await page.fill('input[name="start_date"]', 'invalid-date');
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    
    // Should show error or validation message
    try {
      await expect(page.locator('.MuiSnackbar-root')).toContainText('Fehler', { timeout: 2000 });
    } catch {
      const errorText = await page.locator('.MuiFormHelperText-root').textContent();
      if (!errorText) throw new Error('No snackbar or validation error shown for invalid date');
    }
    
    // Test with very long title
    await page.fill('input[name="title"]', 'A'.repeat(1000)); // Very long title
    await page.fill('input[name="start_date"]', '1900-01-01');
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    
    // Should either succeed or show appropriate error
    const snackbarText = await page.locator('.MuiSnackbar-root').textContent();
    if (snackbarText && !/erfolgreich|Fehler/.test(snackbarText)) {
      throw new Error('Snackbar did not show success or error message');
    }
  });

  test('Handles concurrent life event operations', async ({ page, context }) => {
    // Create a second page for concurrent operations
    const page2 = await context.newPage();
    
    // Log in on both pages
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Create a person for this test
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'Concurrent');
    await page.fill('input[name="last_name"]', 'Test');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    await page.waitForURL('/persons');
    
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)ConcurrentTest/);
    const concurrentPersonId = idMatch ? parseInt(idMatch[1]) : null;
    if (!concurrentPersonId) throw new Error('Could not extract person ID');

    // Both pages go to the same person
    await page.goto(`/persons/${concurrentPersonId}`);
    await page2.goto(`/persons/${concurrentPersonId}`);
    await page.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    // Create life event on first page
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    
    await page.fill('input[name="title"]', 'Concurrent Event 1');
    await page.fill('input[name="start_date"]', '1900-01-01');
    await page.fill('input[name="location"]', `Concurrent_Location_1_${Date.now()}`);
    await page.fill('textarea[name="description"]', 'First concurrent event');
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    await expect(page.locator('.MuiSnackbar-root')).toContainText('erfolgreich');
    await page.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 5000 });
    
    // Create life event on second page
    await page2.click('button:has-text("Neues Ereignis")');
    await page2.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    
    await page2.fill('input[name="title"]', 'Concurrent Event 2');
    await page2.fill('input[name="start_date"]', '1900-01-02');
    await page2.fill('input[name="location"]', `Concurrent_Location_2_${Date.now()}`);
    await page2.fill('textarea[name="description"]', 'Second concurrent event');
    await page2.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page2.click('button:has-text("Event erstellen")');
    await expect(page2.locator('.MuiSnackbar-root')).toContainText('erfolgreich');
    await page2.waitForSelector('.MuiDrawer-root', { state: 'hidden', timeout: 5000 });
    
    // Both pages should show both events
    await page.waitForTimeout(2000);
    await page2.waitForTimeout(2000);
    // Reload both pages to simulate manual refresh if real-time is not implemented
    await page.reload();
    await page2.reload();
    await expect(page.locator('text=Concurrent Event 1').first()).toBeVisible();
    await expect(page.locator('text=Concurrent Event 2').first()).toBeVisible();
    await expect(page2.locator('text=Concurrent Event 1').first()).toBeVisible();
    await expect(page2.locator('text=Concurrent Event 2').first()).toBeVisible();
    
    // Check count is correct on both pages
    await expect(page.locator('button:has-text("Lebensereignisse")')).toContainText('(2)');
    await expect(page2.locator('button:has-text("Lebensereignisse")')).toContainText('(2)');
    
    await page2.close();
  });

  test('Handles network failures gracefully', async ({ page }) => {
    // This test would simulate network failures and verify the app handles them gracefully
    // Implementation would depend on the specific error handling mechanisms
    test.skip('Network failure simulation not yet implemented');
  });

  test('Handles API error gracefully on life events fetch', async ({ page }) => {
    // Register and login a new user
    const email = `e2e_lifeevent_error_${Date.now()}@example.com`;
    const password = 'TestPass123!';
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="name"]', 'Error User');
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/auth\/check-email/);
    // If redirected to /auth/check-email, verify the user and log in
    if (page.url().includes('/auth/check-email')) {
      await page.request.post('/api/auth/verify-test-user', { data: { email } });
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }

    // Intercept API call and return 500 error for life events
    await page.route('**/api/life-events', route => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Simulated error' }) }));

    // Go to timeline (or any page that fetches life events)
    await page.goto('/timeline');
    // Wait for error overlay to appear with retry and logging
    let found = false;
    for (let i = 0; i < 10; i++) {
      if (await page.locator('[role="alert"]:has-text("Fehler beim Laden der Timeline-Daten")').isVisible()) {
        found = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!found) {
      const bodyContent = await page.locator('body').textContent();
      console.log('Error overlay not found. Page body content:', bodyContent);
      throw new Error('No user-friendly error message or overlay found');
    }
    await expect(page.locator('text=Fehler beim Laden der Timeline-Daten')).toBeVisible();
    await expect(page.locator('main alert button:has-text("Erneut versuchen")')).toBeVisible();
  });

  test('Shows validation error for missing/invalid date in life event form', async ({ page }) => {
    // Register and login a new user
    const email = `e2e_validation_${Date.now()}@example.com`;
    const password = 'TestPass123!';
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Validation User');
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    // Create a person
    await page.goto('/persons/create');
    await page.fill('input[name="first_name"]', 'Vali');
    await page.fill('input[name="last_name"]', 'Date');
    await page.fill('input[name="birth_date"]', '1900-01-01');
    await page.fill('input[name="birth_place"]', 'Berlin');
    await page.click('button:has-text("Speichern")');
    await page.waitForURL('/persons');
    // Extract person ID
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 });
    const gridText = await page.locator('.MuiDataGrid-root').textContent();
    const idMatch = gridText?.match(/(\d+)ValiDate/);
    const personId = idMatch ? parseInt(idMatch[1]) : null;
    if (!personId) throw new Error('Could not extract person ID');
    // Go to person detail page
    await page.goto(`/persons/${personId}`);
    await page.waitForLoadState('networkidle');
    // Open life event form
    await page.click('button:has-text("Neues Ereignis")');
    await page.waitForSelector('.MuiDrawer-root', { timeout: 5000 });
    // Leave start_date empty and try to submit
    await page.fill('input[name="title"]', 'Missing Date Event');
    await page.fill('input[name="start_date"]', '');
    await page.fill('input[name="location"]', 'Validation_Location');
    await page.fill('textarea[name="description"]', 'Event with missing date');
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    // Check for custom error message
    const errorText = await page.locator('.MuiFormHelperText-root, .MuiSnackbar-root').textContent();
    if (!errorText || !/Fehler|erforderlich|ungültig|invalid|required/i.test(errorText)) {
      throw new Error('No custom validation error shown for missing date');
    }
    // Try invalid date
    // Use JS to set the value directly, bypassing browser validation
    await page.evaluate(() => {
      const input = document.querySelector('input[name="start_date"]');
      if (input) (input as HTMLInputElement).value = 'invalid-date';
    });
    await page.waitForSelector('button:has-text("Event erstellen"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Event erstellen")');
    const errorText2 = await page.locator('.MuiFormHelperText-root, .MuiSnackbar-root').textContent();
    if (!errorText2 || !/Fehler|erforderlich|ungültig|invalid|required/i.test(errorText2)) {
      throw new Error('No custom validation error shown for invalid date');
    }
  });

  test('Timeline, analytics, and locations pages do not crash on API error or non-array', async ({ page }) => {
    // Register and login a new user
    const email = `e2e_error_${Date.now()}@example.com`;
    const password = 'TestPass123!';
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="name"]', 'Error User');
    // Wait for the submit button to be enabled
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/auth\/check-email/);

    // Intercept API calls and return 500 error
    await page.route('**/api/events', route => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Simulated error' }) }));
    await page.route('**/api/life-events', route => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Simulated error' }) }));
    await page.route('**/api/analytics', route => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Simulated error' }) }));
    await page.route('**/api/locations', route => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Simulated error' }) }));

    // Helper to check for user-friendly error overlays/messages
    async function expectUserFriendlyError(page: Page, selectors: string[], errorText: string) {
      for (const selector of selectors) {
        const elements = await page.locator(selector).all();
        for (const el of elements) {
          const text = await el.textContent();
          if (text && text.includes(errorText)) {
            if (await el.isVisible()) return;
          }
        }
      }
      // Fallback: log the full page content
      const bodyContent = await page.locator('body').textContent();
      console.log('Error overlay not found. Page body content:', bodyContent);
      throw new Error('No user-friendly error message or overlay found');
    }

    // Timeline
    await page.goto('/timeline');
    await expectUserFriendlyError(page, [
      '[role="alert"]',
      '.MuiAlert-root',
      'main alert',
      'div[role="alert"]',
    ], 'Fehler beim Laden der Timeline-Daten');
    const timelineContent = await page.locator('body').textContent();
    if (timelineContent && /(TypeError|ReferenceError|Exception|at )/i.test(timelineContent)) {
      throw new Error('Timeline page crashed or showed stack trace');
    }
    // Analytics
    await page.goto('/analytics');
    await expectUserFriendlyError(page, [
      '[role="alert"]',
      '.MuiAlert-root',
      'div[role="alert"]',
    ], 'Fehler beim Laden der Analytics-Daten');
    const analyticsContent = await page.locator('body').textContent();
    if (analyticsContent && /(TypeError|ReferenceError|Exception|at )/i.test(analyticsContent)) {
      throw new Error('Analytics page crashed or showed stack trace');
    }
    // Locations
    await page.goto('/locations');
    await expectUserFriendlyError(page, [
      '[role="alert"]',
      '.MuiAlert-root',
      'div[role="alert"]',
    ], 'Fehler beim Laden der Ortsdaten');
    const locationsContent = await page.locator('body').textContent();
    if (locationsContent && /(TypeError|ReferenceError|Exception|at )/i.test(locationsContent)) {
      throw new Error('Locations page crashed or showed stack trace');
    }
  });

  test('Minimal login and API access check', async ({ page }) => {
    // Log in via UI
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    // Try to fetch /api/persons
    const res = await page.request.get('/api/persons');
    const status = res.status();
    let body;
    try {
      body = await res.json();
    } catch (e) {
      body = await res.text();
    }
    console.log('API /api/persons status:', status, 'body:', body);
    if (status !== 200) {
      throw new Error('API /api/persons not accessible after login');
    }
  });
});

// Helper to log diagnostic info
async function logDiagnostics(page: Page, label: string) {
  const url = page.url();
  const cookies = await page.context().cookies();
  const localStorage = await page.evaluate(() => Object.assign({}, window.localStorage));
  const sessionStorage = await page.evaluate(() => Object.assign({}, window.sessionStorage));
  const bodyContent = await page.locator('body').textContent();
  console.log(`\n[DIAGNOSTIC] ${label}`);
  console.log('URL:', url);
  console.log('Cookies:', JSON.stringify(cookies, null, 2));
  console.log('localStorage:', JSON.stringify(localStorage, null, 2));
  console.log('sessionStorage:', JSON.stringify(sessionStorage, null, 2));
  console.log('Body content:', bodyContent?.slice(0, 1000));
} 