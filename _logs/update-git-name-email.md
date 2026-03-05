---
layout: log
title: Update git name and email
slug: update-git-name-and-email
---

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

## Set global name and email

```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## Set name and email for current repo only

```
git config user.name "Your Name"
git config user.email "your@email.com"
```
