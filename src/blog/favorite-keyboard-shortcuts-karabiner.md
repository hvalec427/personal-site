---
title: Favorite Keyboard Shortcuts with Karabiner-Elements
created: 2026-05-23
---

# Favorite Keyboard Shortcuts with Karabiner-Elements

I use [Karabiner-Elements](https://karabiner-elements.pqrs.org/) to remap keys at the system level. These changes are small but they add up.

Here are the remappings I currently use and why.

## Caps Lock → Escape (and Escape → Caps Lock)

This is the one I recommend to everyone.

Caps Lock sits on the home row and you almost never need it. Escape is a key you press constantly, especially in Neovim, but it's all the way in the top left corner.

The swap:

- Caps Lock → Escape
- Escape → Caps Lock

Now Escape is right under your left pinky without moving your hand at all. The original Escape key becomes Caps Lock, so you don't lose it. If you don't need Caps Lock at all you can remap it to something else.

## Globe (fn) → Left Control

On Apple keyboards, the Globe key is in the bottom left corner where Control usually sits on other keyboards. Control is used everywhere, terminal shortcuts, tmux, vim keybindings, so having it in that corner position just makes sense. I also struggle with locking my laptop with Control + Command + q where it's easy to click fn key instead of Control. This shortcut fixes this.

```
fn (globe key) → left_control
```

## Right Option → fn (Globe)

Since I moved Globe to Control, I still want access to fn functionality (adjusting volume, brightness, etc. without holding a modifier). I map the right Option key, which I almost never use, to fn.

```
right_option → fn (globe)
```

This way nothing is lost, just reorganized.

## F5 / F6 → Keyboard Backlight

By default, F5 and F6 don't do much useful. I use them to control keyboard backlight brightness.

```
F5 → keyboard backlight down
F6 → keyboard backlight up
```

## The config

You can find the full config in my [dotfiles](https://github.com/hvalec427/dotfiles/blob/master/config/karabiner/.config/karabiner/karabiner.json).
