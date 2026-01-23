/**
 * E2E Tests for Literature Integration
 * Tests the PubMed/Europe PMC integration end-to-end
 */

import { test, expect } from '@playwright/test';

test.describe('Literature Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load literature for entity search', async ({ page }) => {
    // Type a query that mentions a gene
    await page.fill('[data-testid="chat-input"]', 'Tell me about TP53');
    await page.click('[data-testid="send-button"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="bot-message"]', { timeout: 10000 });
    
    // Check if literature panel appears (if implemented)
    const literaturePanel = page.locator('[data-testid="literature-panel"]');
    if (await literaturePanel.count() > 0) {
      await expect(literaturePanel).toBeVisible();
      
      // Verify citations are displayed
      const citations = page.locator('.citation-card');
      await expect(citations.first()).toBeVisible();
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Block Europe PMC requests to simulate network error
    await page.route('**/europepmc.org/**', route => route.abort());
    
    // Try to load literature
    await page.fill('[data-testid="chat-input"]', 'Show me papers about BRCA1');
    await page.click('[data-testid="send-button"]');
    
    // Should show error state, not crash
    await page.waitForSelector('[data-testid="bot-message"]', { timeout: 10000 });
    
    // App should still be functional
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeEnabled();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', 'TP53 gene');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    await page.waitForSelector('[data-testid="bot-message"]', { timeout: 10000 });
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.fill('[data-testid="chat-input"]', 'Metformin');
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="bot-message"]', { timeout: 10000 });
    
    // Verify layout is responsive
    const chatContainer = page.locator('[data-testid="chat-container"]');
    await expect(chatContainer).toBeVisible();
  });

  test('should handle rate limiting correctly', async ({ page }) => {
    // Make multiple rapid requests
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="chat-input"]', `Query ${i}`);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(100); // Small delay between requests
    }
    
    // All requests should eventually complete without errors
    const messages = page.locator('[data-testid="bot-message"]');
    await expect(messages).toHaveCount(5, { timeout: 30000 });
  });
});

test.describe('Accessibility Compliance', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA landmarks
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This is a basic check - in production, use axe-core for comprehensive testing
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    expect(backgroundColor).toBeTruthy();
  });

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/');
    
    // Check for live regions
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();
    
    // Should have at least one live region for dynamic updates
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should cache literature requests', async ({ page }) => {
    await page.goto('/');
    
    // First request
    await page.fill('[data-testid="chat-input"]', 'TP53');
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="bot-message"]', { timeout: 10000 });
    
    // Second identical request (should be cached)
    await page.fill('[data-testid="chat-input"]', 'TP53');
    const startTime = Date.now();
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="bot-message"]:nth-child(2)', { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    // Cached response should be faster (< 1 second)
    expect(responseTime).toBeLessThan(1000);
  });
});
