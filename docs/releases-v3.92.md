# Loadnote v3.92.0 — First Workout Experience

## Purpose
Make the first logged workout easy without removing Loadnote's advanced strength tools.

## Changes
**Start my first workout** is now the primary onboarding action. New lifters can enter their own exercises and sets immediately without creating a program, entering a training max or signing in. “Help me create a plan” and “I already have a program” remain accessible but secondary.

Simple Home is the default only when the device has no saved view preference and no existing workouts, programming profile, approved/scheduled programs or dismissed onboarding. Saved view choices and existing training stay as-is.

The workout guide now follows real interaction milestones: exercise name, entered reps or timed work, review, and explicit save. The review modal explains that opening review does **not** save a workout. The guide never guesses missing RPE, assumes a one-rep max, checks a set as complete, or creates a program.

## Validation and rollback
Added and updated unit/browser coverage for default view eligibility, guided form stages, save confirmation, offline-local training integrity, and legacy preferences. Require the complete existing Node/static, security, Chromium, WebKit, native build and real-device offline tests before merging.

Version **3.92.0**, beta **35200**, schema **34** unchanged. Preserve v3.91.1 as a rollback.
