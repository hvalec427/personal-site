document.addEventListener("alpine:init", () => {
  Alpine.data("adminTabs", () => ({
    tab: "habits",
  }));

  Alpine.data("habitsPanel", () => ({
    habits: [],
    newName: "",
    newCadence: "daily",

    load() {
      fetch(`${window.API_BASE_URL}/habits`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((habits) => {
          this.habits = habits;
        })
        .catch(() => {});
    },

    toggle(habit) {
      const previous = habit.doneToday;
      habit.doneToday = !previous;
      fetch(`${window.API_BASE_URL}/habits/${habit.id}/log`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((result) => {
          habit.doneToday = result.doneToday;
        })
        .catch(() => {
          habit.doneToday = previous;
        });
    },

    add() {
      const name = this.newName.trim();
      if (!name) return;
      fetch(`${window.API_BASE_URL}/habits`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cadence: this.newCadence }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((habit) => {
          this.habits.push(habit);
          this.newName = "";
        })
        .catch(() => {});
    },
  }));
});
