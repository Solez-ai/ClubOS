import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('signup: single page shows role cards and all fields immediately', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);

  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

  // Role cards are on the same page as the form — no separate "Continue" step.
  await expect(page.getByRole('button', { name: /Participant/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Organizer/ }).first()).toBeVisible();

  await expect(page.getByLabel('Full Name')).toBeVisible();
  await expect(page.getByLabel('Email Address')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Confirm Password')).toBeVisible();
  await expect(page.getByLabel('Phone Number (Optional)')).toBeVisible();
  await expect(page.getByText('Profile picture (optional)')).toBeVisible();

  // One click: Create Account. No intermediate Continue button anywhere.
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0);
});

test('signup: organizer role reveals organization field without leaving the page', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);

  await expect(page.getByLabel('Organization Name')).toHaveCount(0);

  await page.getByRole('button', { name: /Organizer/ }).first().click();

  await expect(page.getByLabel('Organization Name')).toBeVisible();

  // Still the same single page — password fields never disappeared.
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
});

test('signup: client validation blocks bad input and shows friendly errors', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);

  await page.getByLabel('Full Name').fill('Test User');
  await page.getByLabel('Email Address').fill('not-an-email');
  await page.getByLabel('Password', { exact: true }).fill('12345');
  await page.getByLabel('Confirm Password').fill('123456');

  const submit = page.getByRole('button', { name: 'Create Account' });
  await submit.click();

  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();

  await page.getByLabel('Email Address').fill('test@example.com');
  await submit.click();
  await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible();

  await page.getByLabel('Password', { exact: true }).fill('longenough');
  await submit.click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
});
