import { test, expect } from '@playwright/test';

test.describe('Authentication and Core Lifecycle', () => {
  
  test('Admin can login and see dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Fill credentials
    await page.fill('input[type="email"]', 'admin@mathbuddy.com');
    await page.fill('input[type="password"]', 'Admin123!');
    
    // Click submit
    await page.click('button[type="submit"]');

    // Verify navigation to admin dashboard
    await expect(page).toHaveURL('/admin');
    
    // Check for dashboard elements
    await expect(page.locator('h1').or(page.locator('h2')).first()).toContainText(/admin/i);
  });

  test('Teacher can login and see classes', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'teacher@mathbuddy.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Should redirect to teacher dashboard
    await expect(page).toHaveURL('/teacher');
    
    // Navigate to classes
    await page.click('text=Classes');
    await expect(page).toHaveURL(/\/teacher\/classes/);
    
    // Check if the page loaded successfully
    await expect(page.locator('text=Classes').first()).toBeVisible();
  });

  test('Student can login and view dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'student@mathbuddy.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Should redirect to student dashboard
    await expect(page).toHaveURL('/student');
    
    // Check for Next Classes or Remaining Hours card
    await expect(page.locator('text=Remaining Hours')).toBeVisible();
  });
});
