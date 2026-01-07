---
layout: default
title: Mobile App Release Checklists - Hvalec
---

# Mobile App Release Checklists

A compact checklist to publish mobile apps to Google Play and the App Store. Use this as your release playbook.

## 1) Accounts & access

- Confirm Google Play Console and Apple Developer accounts.
- Provide a public privacy policy URL (HTTPS).

## 2) Identifiers & versions

- Confirm Bundle ID / ApplicationId.
- Prepare short & long descriptions, keywords, categories, and localized metadata.

## 3) Privacy & permissions

- Host a reachable privacy policy (HTTPS).

## 4) Icons

- Android: 512×512 store icon, adaptive icon layers, keep vector source.
- iOS: 1024×1024 PNG (no transparency), keep source for exports.

## 5) Screenshots

- Prepare phone and tablet screenshots per store requirements (localize if needed).

## 6) Play Store assets (Android)

- App icon, feature graphic (1024×500), screenshots, optional promo video, category & contact info.

## 7) App Store assets (iOS)

- App icon (1024×1024), screenshots, optional previews, App Privacy questionnaire.

## 8) Build & signing

- Android: build `.aab`, sign with keystore, increment `versionCode`, upload to Play Console.
- iOS: archive in Xcode, ensure provisioning/certs, increment build number, upload via Xcode/Transporter.
- Backup keystore/certs securely; never commit private keys.

## 9) Testing & beta

- Run core flow tests on devices, use crash reporting, use internal testing tracks (Android) and TestFlight (iOS).

## 10) Publishing steps (high level)

- Android: create release, upload `.aab`, add notes/assets, complete rating/pricing, set rollout.
- iOS: upload build, select build, add notes/screenshots, complete privacy/metadata, submit for review.

## 11) Success

When your release is accepted and the store shows the app as published, finish these wrap-up actions to fully complete the release:

- Confirm status: verify the app is listed in the store (or rollout percent reached).
- Post-release notes: publish release notes / changelog and notify stakeholders (email, slack, blog, social).
- Tag the release: create a Git tag and attach release artifacts in your repo.
- Archive artifacts: move signed builds, screenshots, and keystore backups to your secure storage.
- Close tasks: mark the release ticket done and update any project tracking items.
- Monitor & act: keep monitoring crashes, reviews, and analytics for 24–72 hours and be ready to publish a hotfix.
