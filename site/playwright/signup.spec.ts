import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';



test('signup: choosing a role and clicking Continue advances to step 2', async ({ page }) => {  await page.goto(`${BASE_URL}/signup`);

  await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose your role to get started' })).toBeVisible();

  await page.getByRole('button', { name: 'Participant' }).first().click();
  await expect(page.getByRole('button', { name: 'Participant' }).first()).toHaveClass(/border-\[var\(--accent\)\]/);
  await expect(page.getByRole('button', { name: 'Participant' }).first()).toContainText('Participant');

  await page.getByRole('button', { name: 'Continue' }).first().click();

  await expect(page.getByRole('heading', { name: 'Set Up Your Account' })).toBeVisible();
  await expect(page.getByText('Account Details')).toBeVisible();
  await expect(page.getByLabel('Full Name')).toBeVisible();
  await expect(page.getByLabel('Email Address')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByLabel('Confirm Password')).toBeVisible();
});

test('signup: organizer role shows organization field and Continue is enabled', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);

  await page.getByRole('button', { name: 'Organizer' }).first().click();

  await expect(page.getByLabel('Organization Name')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' }).first()).toBeEnabled();

  await page.getByRole('button', { name: 'Continue' }).first().click();
  await expect(page.getByLabel('Organization Name')).toBeVisible();
});

test('signup: step 2 submit button is disabled until fields are filled', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);

  await page.getByRole('button', { name: 'Participant' }).first().click();
  await page.getByRole('button', { name: 'Continue' }).first().click();

  const submit = page.getByRole('button', { name: 'Create Account' });
  await expect(submit).toBeDisabled();
});

test('signup: completing the form submits and shows errors for bad input', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`);

  await page.getByRole('button', { name: 'Participant' }).first().click();
  await page.getByRole('button', { name: 'Continue' }).first().click();

  await page.getByLabel('Full Name').fill('Test User');
  await page.getByLabel('Email Address').fill('not-an-email');
  await page.getByLabel('Password').fill('12345');
  await page.getByLabel('Confirm Password').fill('12345');

  const submit = page.getByRole('button', { name: 'Create Account' });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText('That email address looks invalid')).toBeVisible();
});
