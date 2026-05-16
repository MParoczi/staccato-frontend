---
status: complete
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
result: issue
reported: "Almost: a question mark appears in the circular avatar instead of initials"
severity: minor

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
result: issue
reported: "When I upload the selected image I got 405 status code as response but there is no body for the response"
severity: major

### 7. Avatar 2 MB size limit
expected: Selecting an image file larger than 2 MB does NOT upload it. Instead, an error message appears (something like "File too large") and the avatar remains unchanged.
result: pass

### 8. Profile form save
expected: Editing the First Name or Last Name field and clicking Save shows a success message and the changes persist. If you navigate away and return, the updated name is still shown.
result: issue
reported: "I got 405 status code as response when I tried to update the First name and Last name fields"
severity: major

### 9. Language preference
expected: Changing the Language dropdown to Hungarian (or English) and saving switches the UI language. Labels, buttons, and text throughout the app update to the selected language.
result: issue
reported: "I got 405 as response so I couldn't save the language change"
severity: major

### 10. Default page size preference
expected: Changing the Default Page Size dropdown (A4 / A5 / Letter / none) and clicking Save shows a success message. The preference is stored.
result: issue
reported: "no (same 405 failure as tests 8 and 9)"
severity: major

### 11. Default instrument preference
expected: The Default Instrument dropdown loads a list of instruments (from the API). Selecting one and clicking Save shows a success message. If the API fails to load, a fallback disabled input is shown instead of crashing.
result: issue
reported: "Instrument list loads correctly but save returns 405 (same as tests 8-10)"
severity: major

### 12. Account deletion dialog
expected: The "Delete Account" button is in a clearly marked "Danger zone" section at the bottom of the profile page. Clicking it opens a confirmation dialog asking you to confirm the deletion before anything happens.
result: pass

### 13. Scheduled deletion banner
expected: After confirming account deletion (or if your account already has a scheduled deletion date), a warning banner appears at the top of the profile page showing the scheduled deletion date. The banner also shows a "Cancel Deletion" button that lets you reverse the request.
result: issue
reported: "Clicking the Delete account button in the pop up returns with a 404 API response"
severity: major

## Summary

total: 13
passed: 6
issues: 7
skipped: 0
pending: 0

## Gaps

- truth: "Avatar in Navbar shows user initials derived from firstName + lastName (or displayName fallback)"
  status: failed
  reason: "User reported: question mark appears in the circular avatar instead of initials"
  severity: minor
  test: 1
  artifacts: [src/components/Navbar.tsx]
  missing: []

- truth: "Selecting a valid image triggers upload with loading spinner; avatar updates on success"
  status: failed
  reason: "User reported: 405 Method Not Allowed with no response body on avatar upload"
  severity: major
  test: 6
  artifacts: [src/features/profile/api/profileApi.ts]
  missing: []

- truth: "Editing First Name or Last Name and clicking Save persists the change with a success message"
  status: failed
  reason: "User reported: 405 status code when updating First Name and Last Name fields"
  severity: major
  test: 8
  artifacts: [src/features/profile/api/profileApi.ts]
  missing: []

- truth: "Changing language dropdown and saving switches UI language immediately"
  status: failed
  reason: "User reported: 405 as response, could not save language change"
  severity: major
  test: 9
  artifacts: [src/features/profile/api/profileApi.ts]
  missing: []

- truth: "Changing default page size and saving persists the preference with a success message"
  status: failed
  reason: "User reported: same 405 failure as tests 8 and 9"
  severity: major
  test: 10
  artifacts: [src/features/profile/api/profileApi.ts]
  missing: []

- truth: "Instrument list loads and selecting one + saving persists the preference"
  status: failed
  reason: "Instrument list loads correctly (GET 200) but save returns 405; same root cause as tests 8-10"
  severity: major
  test: 11
  artifacts: [src/features/profile/api/profileApi.ts]
  missing: []

- truth: "Confirming deletion schedules account deletion and shows banner with cancel option"
  status: failed
  reason: "User reported: 404 on Delete account confirmation — requestDeletion calls POST /users/me/deletion which does not exist"
  severity: major
  test: 13
  artifacts: [src/features/profile/api/profileApi.ts]
  missing: []
