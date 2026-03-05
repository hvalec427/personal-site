---
layout: log
title: Update git name and email
slug: update-git-name-and-email
created_at: 2026-03-05
updated_at: 2026-03-05
---

# How to check and update git name and email

Quickly check and update your git user name and email for global or per-project settings.

## Check current git name and email

To see your current global git user name and email:

```
git config --global user.name
git config --global user.email
```

To see the name and email for the current repository (if set):

```
git config user.name
git config user.email
```

## Set name and email

Set the global name and email

```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Set name and email for current repo only

```
git config user.name "Your Name"
git config user.email "your@email.com"
```
