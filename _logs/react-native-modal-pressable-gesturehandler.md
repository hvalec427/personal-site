---
layout: log
title: React Native Pressable Not Working in Modal (Quick Fix)
slug: react-native-modal-pressable-gesturehandler
created_at: 2026-03-05
updated_at: 2026-03-05
---

# React Native: Pressable Not Working in Modal (Quick Fix)

**Problem:**

- `Pressable` (or gesture components) inside a `Modal` don’t respond to taps.
- Happens with `react-native-gesture-handler`.

**Why:**

- `Modal` renders outside the normal view tree, so gestures break unless wrapped in `GestureHandlerRootView`.

**Fix:**
{% raw %}

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";

<Modal transparent>
  <GestureHandlerRootView style={{ flex: 1 }}>
    <Pressable onPress={onClose}>
      <Text>Close</Text>
    </Pressable>
  </GestureHandlerRootView>
</Modal>;
```

{% endraw %}

- {% raw %}`style={{ flex: 1 }}`{% endraw %} is required so gestures work everywhere in the modal.

**Rule:**

- Always wrap modal content with `GestureHandlerRootView` if using gesture components inside a `Modal`.
