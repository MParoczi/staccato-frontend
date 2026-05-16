---
status: passed
phase: 03-user-profile-account
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
  - 03-04-SUMMARY.md
started: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Navbar visible on app pages
expected: After logging in, every /app/* page shows a sticky header at the top. Left side: app name ("Staccato"). Right side: a circular avatar with your initials. The header stays fixed when you scroll.
result: pass

### 2. Avatar dropdown opens
expected: Clicking the avatar circle in the top-right opens a dropdown menu with two items: "My Profile" and "Sign out".
result: pass

### 3. My Profile navigation
expected: Clicking "My Profile" in the dropdown closes it and navigates to /app/profile without a full page reload.
result: pass

### 4. Sign out
expected: Clicking "Sign out" clears the session and redirects to /login. You are no longer able to access /app/* routes without logging in again.
result: pass

### 5. Profile page loads
expected: Navigating to /app/profile shows a profile page with: avatar at top, First Name and Last Name text fields (pre-filled with your name), a read-only email display, and preference dropdowns for Language, Default Page Size, and Default Instrument.
result: pass

### 6. Avatar upload
expected: Clicking the avatar on the profile page triggers a file picker. Selecting a valid image (JPEG, PNG, or WebP under 2 MB) shows a loading spinner over the avatar, then the avatar updates to the new image.
result: pass

### 7. Avatar 2 MB size limit
expected: Selecting an image file larger than 2 MB does NOT upload it. Instead, an error message appears (something like "File too large") and the avatar remains unchanged.
result: pass

### 8. Profile form save
expected: Editing the First Name or Last Name field and clicking Save shows a success message and the changes persist. If you navigate away and return, the updated name is still shown.
result: pass

### 9. Language preference
expected: Changing the Language dropdown to Hungarian (or English) and saving switches the UI language. Labels, buttons, and text throughout the app update to the selected language.
result: pass

### 10. Default page size preference
expected: Changing the Default Page Size dropdown (A4 / A5 / Letter / none) and clicking Save shows a success message. The preference is stored.
result: pass

### 11. Default instrument preference
expected: The Default Instrument dropdown loads a list of instruments (from the API). Selecting one and clicking Save shows a success message. If the API fails to load, a fallback disabled input is shown instead of crashing.
result: pass

### 12. Account deletion dialog
expected: The "Delete Account" button is in a clearly marked "Danger zone" section at the bottom of the profile page. Clicking it opens a confirmation dialog asking you to confirm the deletion before anything happens.
result: pass

### 13. Scheduled deletion banner
expected: After confirming account deletion (or if your account already has a scheduled deletion date), a warning banner appears at the top of the profile page showing the scheduled deletion date. The banner also shows a "Cancel Deletion" button that lets you reverse the request.
result: pass

## Summary

total: 13
passed: 13
issues: 0
skipped: 0
pending: 0

## Gaps

None.
