(function () {
  "use strict";

  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // The dashboard remains usable if browser storage is unavailable.
      }
    }
  };

  const plantStorageKey = "sprout-plants";
  const reminderStorageKey = "sprout-reminders";
  const gardenLightStorageKey = "sprout-garden-light";
  const samplePlants = INITIAL_PLANTS.map(function (plant) {
    return {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      interval: plant.interval,
      lastWatered: new Date(Date.now() - plant.daysSinceWatered * 86400000).toISOString(),
      notes: plant.notes,
      image: plant.image
    };
  });
  let plants = storage.get(plantStorageKey, samplePlants);
  let reminders = storage.get(reminderStorageKey, {
    morning: "08:00",
    evening: "18:00",
    notifications: false,
    sent: {}
  });
  let savedGardenLight = storage.get(gardenLightStorageKey, "bright");
  let editingPlantId = null;
  let toastTimer;

  const plantGrid = document.getElementById("plant-grid");
  const emptyState = document.getElementById("empty-state");
  const priorityCallout = document.getElementById("priority-callout");
  const plantDialog = document.getElementById("plant-dialog");
  const plantForm = document.getElementById("plant-form");
  const toast = document.getElementById("toast");
  const morningInput = document.getElementById("morning-time");
  const eveningInput = document.getElementById("evening-time");
  const notificationButton = document.getElementById("notification-button");
  const gardenLightSelect = document.getElementById("garden-light");
  const shopFilter = document.getElementById("shop-filter");
  const compatibleOnly = document.getElementById("compatible-only");
  const shopGrid = document.getElementById("shop-grid");
  const shopEmpty = document.getElementById("shop-empty");
  const comparisonList = document.getElementById("garden-comparison");

  function savePlants() {
    storage.set(plantStorageKey, plants);
  }

  function daysSinceWatered(plant) {
    const elapsed = Date.now() - new Date(plant.lastWatered).getTime();
    return Math.max(0, Math.floor(elapsed / 86400000));
  }

  function careState(plant) {
    const elapsed = daysSinceWatered(plant);
    const daysLeft = Math.max(0, plant.interval - elapsed);
    return {
      elapsed: elapsed,
      daysLeft: daysLeft,
      due: elapsed >= plant.interval,
      urgency: elapsed / plant.interval
    };
  }

  function orderedPlants() {
    return plants.slice().sort(function (first, second) {
      const difference = careState(second).urgency - careState(first).urgency;
      return difference || first.name.localeCompare(second.name);
    });
  }

  function isWateredToday(plant) {
    return new Date(plant.lastWatered).toDateString() === new Date().toDateString();
  }

  function makePlantCard(plant) {
    const state = careState(plant);
    const card = document.createElement("article");
    card.className = "plant-card" + (state.due ? " is-due" : "");

    const photo = document.createElement("div");
    photo.className = "plant-photo";
    const image = document.createElement("img");
    image.src = plant.image;
    image.alt = plant.name + " plant";
    image.loading = "lazy";
    const badge = document.createElement("span");
    badge.className = "care-badge" + (state.due ? " badge-due" : "");
    badge.textContent = state.due ? "Needs water" : state.daysLeft === 1 ? "Due tomorrow" : "Looking good";
    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", "Remove " + plant.name);
    removeButton.title = "Remove plant";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", function () {
      removePlant(plant.id);
    });
    photo.append(image, badge, removeButton);

    const body = document.createElement("div");
    body.className = "plant-card-body";
    const heading = document.createElement("div");
    heading.className = "plant-title-row";
    const titleGroup = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = plant.name;
    const species = document.createElement("p");
    species.className = "plant-species";
    species.textContent = plant.species || "Houseplant";
    titleGroup.append(title, species);
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit " + plant.name + " care details");
    editButton.addEventListener("click", function () {
      openPlantDialog(plant);
    });
    heading.append(titleGroup, editButton);

    const note = document.createElement("p");
    note.className = "plant-note";
    note.textContent = plant.notes || "No care notes yet. Add a note to remember what this plant likes.";

    const careLine = document.createElement("div");
    careLine.className = "care-line";
    const schedule = document.createElement("span");
    schedule.textContent = "Every " + plant.interval + " days";
    const dueLabel = document.createElement("span");
    dueLabel.className = state.due ? "due-label" : "next-label";
    dueLabel.textContent = state.due
      ? state.elapsed === plant.interval ? "Due now" : elapsedLabel(state.elapsed - plant.interval) + " overdue"
      : state.daysLeft === 1 ? "Tomorrow" : "In " + state.daysLeft + " days";
    careLine.append(schedule, dueLabel);

    const progressTrack = document.createElement("div");
    progressTrack.className = "care-progress";
    progressTrack.setAttribute("aria-label", state.due ? "Watering interval passed" : state.daysLeft + " days until watering is due");
    const progress = document.createElement("span");
    progress.style.width = Math.min(100, state.urgency * 100) + "%";
    progressTrack.append(progress);

    const footer = document.createElement("div");
    footer.className = "plant-card-footer";
    const watered = document.createElement("span");
    watered.className = "last-watered";
    watered.textContent = isWateredToday(plant) ? "Watered today" : "Last watered " + elapsedLabel(state.elapsed) + " ago";
    const waterButton = document.createElement("button");
    waterButton.type = "button";
    waterButton.className = "water-button";
    waterButton.textContent = "Watered";
    waterButton.setAttribute("aria-label", "Mark " + plant.name + " as watered");
    waterButton.addEventListener("click", function () {
      markWatered(plant.id);
    });
    footer.append(watered, waterButton);

    body.append(heading, note, careLine, progressTrack, footer);
    card.append(photo, body);
    return card;
  }

  function elapsedLabel(days) {
    if (days <= 0) return "today";
    if (days === 1) return "1 day";
    return days + " days";
  }

  function renderPriority(sorted) {
    if (sorted.length === 0) {
      priorityCallout.hidden = true;
      priorityCallout.replaceChildren();
      return;
    }

    const first = sorted[0];
    const state = careState(first);
    priorityCallout.hidden = false;
    priorityCallout.className = "priority-callout" + (state.due ? " priority-due" : "");
    const symbol = document.createElement("span");
    symbol.className = "priority-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = state.due ? "!" : "↗";
    const copy = document.createElement("div");
    copy.className = "priority-copy";
    const label = document.createElement("span");
    label.className = "priority-kicker";
    label.textContent = state.due ? "FIRST ON THE LIST" : "UP NEXT";
    const message = document.createElement("p");
    message.textContent = state.due
      ? first.name + " is ready for a drink."
      : first.name + " is your next plant to check, " + (state.daysLeft === 1 ? "tomorrow." : "in " + state.daysLeft + " days.");
    copy.append(label, message);
    const detail = document.createElement("span");
    detail.className = "priority-detail";
    detail.textContent = state.due ? "Watering interval passed" : "Every " + first.interval + " days";
    priorityCallout.replaceChildren(symbol, copy, detail);
  }

  function renderGardenComparison() {
    const onSchedule = plants.filter(function (plant) { return !careState(plant).due; }).length;
    const gardens = [{
      name: "Your garden",
      detail: plants.length ? onSchedule + " of " + plants.length + " plants on schedule" : "Add plants to start your comparison",
      score: plants.length ? Math.round(onSchedule / plants.length * 100) : 0,
      location: "YOUR COLLECTION",
      yours: true
    }].concat(SAMPLE_GARDENS.map(function (garden) {
      return {
        name: garden.name,
        detail: garden.onSchedule + " of " + garden.plants + " plants on schedule · " + garden.style,
        score: Math.round(garden.onSchedule / garden.plants * 100),
        location: garden.location,
        yours: false
      };
    }));

    const rows = gardens.map(function (garden) {
      const row = document.createElement("article");
      row.className = "compare-row" + (garden.yours ? " is-yours" : "");
      const identity = document.createElement("div");
      identity.className = "compare-identity";
      const label = document.createElement("span");
      label.className = "compare-location";
      label.textContent = garden.location;
      const name = document.createElement("strong");
      name.textContent = garden.name;
      const detail = document.createElement("span");
      detail.className = "compare-detail";
      detail.textContent = garden.detail;
      identity.append(label, name, detail);

      const meter = document.createElement("div");
      meter.className = "compare-meter";
      meter.setAttribute("role", "img");
      meter.setAttribute("aria-label", garden.score + "% of plants currently on schedule");
      const fill = document.createElement("span");
      fill.style.width = garden.score + "%";
      meter.append(fill);

      const score = document.createElement("strong");
      score.className = "compare-score";
      score.textContent = garden.score + "%";
      row.append(identity, meter, score);
      return row;
    });
    comparisonList.replaceChildren.apply(comparisonList, rows);
  }

  function makeShopCard(listing) {
    const fitsLight = listing.light === gardenLightSelect.value;
    const alreadyAdded = plants.some(function (plant) { return plant.catalogId === listing.id; });
    const card = document.createElement("article");
    card.className = "shop-card" + (listing.stock === 0 ? " is-sold-out" : "");

    const photo = document.createElement("div");
    photo.className = "shop-photo";
    const image = document.createElement("img");
    image.src = listing.image;
    image.alt = listing.name;
    image.loading = "lazy";
    const fitBadge = document.createElement("span");
    fitBadge.className = "shop-fit-badge" + (fitsLight ? " fits" : "");
    fitBadge.textContent = fitsLight ? "Fits your light" : "Check light needs";
    photo.append(image, fitBadge);

    const body = document.createElement("div");
    body.className = "shop-card-body";
    const titleRow = document.createElement("div");
    titleRow.className = "shop-title-row";
    const titleGroup = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = listing.name;
    const species = document.createElement("p");
    species.className = "shop-species";
    species.textContent = listing.species;
    titleGroup.append(title, species);
    const price = document.createElement("strong");
    price.className = "shop-price";
    price.textContent = "CAD $" + listing.price;
    titleRow.append(titleGroup, price);

    const shopName = document.createElement("p");
    shopName.className = "shop-name";
    shopName.textContent = listing.shop;
    const location = document.createElement("span");
    location.className = "shop-location";
    location.textContent = listing.neighborhood;
    const notes = document.createElement("p");
    notes.className = "shop-care-note";
    notes.textContent = listing.notes;

    const footer = document.createElement("div");
    footer.className = "shop-card-footer";
    const stock = document.createElement("span");
    stock.className = listing.stock === 0 ? "stock-label sold-out" : "stock-label";
    stock.textContent = listing.stock === 0 ? "Out of stock" : listing.stock <= 2 ? "Only " + listing.stock + " left" : "Available · " + listing.stock;
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "shop-add-button";
    addButton.textContent = listing.stock === 0 ? "Sold out" : alreadyAdded ? "In your garden" : "Add to garden";
    addButton.disabled = listing.stock === 0 || alreadyAdded;
    if (!addButton.disabled) {
      addButton.addEventListener("click", function () { addShopPlant(listing); });
    }
    footer.append(stock, addButton);

    body.append(titleRow, shopName, location, notes, footer);
    card.append(photo, body);
    return card;
  }

  function renderShopListings() {
    const selectedShop = shopFilter.value;
    const filtered = SHOP_LISTINGS.filter(function (listing) {
      const shopMatches = selectedShop === "all" || listing.shop === selectedShop;
      const lightMatches = !compatibleOnly.checked || listing.light === gardenLightSelect.value;
      return shopMatches && lightMatches;
    });
    shopGrid.replaceChildren.apply(shopGrid, filtered.map(makeShopCard));
    shopEmpty.hidden = filtered.length > 0;
    document.getElementById("shop-result-count").textContent = "Showing " + filtered.length + (filtered.length === 1 ? " plant" : " plants");
  }

  function renderDiscovery() {
    renderGardenComparison();
    renderShopListings();
  }

  function addShopPlant(listing) {
    if (listing.stock === 0 || plants.some(function (plant) { return plant.catalogId === listing.id; })) return;
    plants.push({
      id: "shop-" + listing.id + "-" + Date.now(),
      catalogId: listing.id,
      sourceShop: listing.shop,
      name: listing.name,
      species: listing.species,
      interval: listing.interval,
      lastWatered: new Date().toISOString(),
      notes: listing.notes,
      image: listing.image,
      light: listing.light
    });
    savePlants();
    render();
    showToast(listing.name + " added to your garden.");
  }

  function render() {
    const sorted = orderedPlants();
    plantGrid.replaceChildren.apply(plantGrid, sorted.map(makePlantCard));
    plantGrid.hidden = sorted.length === 0;
    emptyState.hidden = sorted.length > 0;
    document.getElementById("plant-count").textContent = sorted.length;
    document.getElementById("due-count").textContent = plants.filter(function (plant) {
      return careState(plant).due;
    }).length;
    document.getElementById("watered-count").textContent = plants.filter(isWateredToday).length;

    const dueCount = plants.filter(function (plant) { return careState(plant).due; }).length;
    const message = dueCount > 0
      ? dueCount + (dueCount === 1 ? " plant could use some care today." : " plants could use some care today.")
      : plants.length === 0 ? "Add a plant to begin your routine." : "Your garden is looking good today.";
    document.getElementById("daily-message").textContent = message;
    renderPriority(sorted);
    renderDiscovery();
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2800);
  }

  function markWatered(id) {
    plants = plants.map(function (plant) {
      return plant.id === id ? Object.assign({}, plant, { lastWatered: new Date().toISOString() }) : plant;
    });
    savePlants();
    render();
    const plant = plants.find(function (item) { return item.id === id; });
    showToast(plant.name + " marked as watered.");
  }

  function removePlant(id) {
    const plant = plants.find(function (item) { return item.id === id; });
    if (!plant || !window.confirm("Remove " + plant.name + " from your plants?")) return;
    plants = plants.filter(function (item) { return item.id !== id; });
    savePlants();
    render();
    showToast(plant.name + " removed from your garden.");
  }

  function openPlantDialog(plant) {
    editingPlantId = plant ? plant.id : null;
    document.getElementById("dialog-title").textContent = plant ? "Edit plant" : "Add a plant";
    document.getElementById("save-plant-button").textContent = plant ? "Save changes" : "Add to my plants";
    document.getElementById("plant-name").value = plant ? plant.name : "";
    document.getElementById("plant-species").value = plant ? plant.species : "";
    document.getElementById("plant-interval").value = plant ? plant.interval : 7;
    document.getElementById("plant-notes").value = plant ? plant.notes : "";
    plantDialog.showModal();
    document.getElementById("plant-name").focus();
  }

  function savePlant(event) {
    event.preventDefault();
    if (!plantForm.reportValidity()) return;
    const existing = plants.find(function (plant) { return plant.id === editingPlantId; });
    const imageChoices = INITIAL_PLANTS.map(function (plant) { return plant.image; });
    const plantData = {
      name: document.getElementById("plant-name").value.trim(),
      species: document.getElementById("plant-species").value.trim(),
      interval: Number(document.getElementById("plant-interval").value),
      notes: document.getElementById("plant-notes").value.trim(),
      image: existing ? existing.image : imageChoices[plants.length % imageChoices.length]
    };

    if (existing) {
      plants = plants.map(function (plant) {
        return plant.id === editingPlantId ? Object.assign({}, plant, plantData) : plant;
      });
    } else {
      plantData.id = "plant-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
      plantData.lastWatered = new Date().toISOString();
      plants.push(plantData);
    }
    savePlants();
    plantDialog.close();
    plantForm.reset();
    editingPlantId = null;
    render();
    showToast(existing ? "Plant details saved." : "Plant added to your garden.");
  }

  function saveReminderTimes() {
    reminders.morning = morningInput.value || "08:00";
    reminders.evening = eveningInput.value || "18:00";
    storage.set(reminderStorageKey, reminders);
    document.getElementById("reminder-status").textContent = "Your two daily check-ins are set. Alerts need this page open.";
  }

  function updateNotificationButton() {
    if (reminders.notifications) {
      notificationButton.innerHTML = "Browser alerts on <span aria-hidden=\"true\">✓</span>";
      notificationButton.classList.add("alerts-on");
    } else {
      notificationButton.innerHTML = "Enable browser alerts <span aria-hidden=\"true\">↗</span>";
      notificationButton.classList.remove("alerts-on");
    }
  }

  async function toggleNotifications() {
    if (!("Notification" in window)) {
      document.getElementById("reminder-status").textContent = "This browser does not support desktop notifications.";
      return;
    }
    if (reminders.notifications) {
      reminders.notifications = false;
    } else {
      const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      if (permission !== "granted") {
        document.getElementById("reminder-status").textContent = "Browser alerts are blocked. You can still use the in-app schedule.";
        return;
      }
      reminders.notifications = true;
    }
    storage.set(reminderStorageKey, reminders);
    updateNotificationButton();
    document.getElementById("reminder-status").textContent = reminders.notifications
      ? "Browser alerts are on. Keep this page open for your check-ins."
      : "Browser alerts are off. Your reminder times are saved.";
  }

  function checkReminderTime() {
    if (!reminders.notifications || !("Notification" in window) || Notification.permission !== "granted") return;
    const now = new Date();
    const currentTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    const dateKey = now.toISOString().slice(0, 10);
    [
      { key: "morning", label: "Morning" },
      { key: "evening", label: "Evening" }
    ].forEach(function (reminder) {
      const sentKey = dateKey + "-" + reminder.key;
      if (reminders[reminder.key] !== currentTime || reminders.sent[sentKey]) return;
      const due = plants.filter(function (plant) { return careState(plant).due; }).length;
      const notification = new Notification("Sprout: " + reminder.label.toLowerCase() + " check-in", {
        body: due > 0 ? due + (due === 1 ? " plant is ready for a check." : " plants are ready for a check.") : "Take a moment to check in with your plants.",
        tag: "sprout-" + sentKey
      });
      notification.onclick = function () {
        window.focus();
        notification.close();
      };
      reminders.sent[sentKey] = true;
      storage.set(reminderStorageKey, reminders);
    });
  }

  function setup() {
    morningInput.value = reminders.morning;
    eveningInput.value = reminders.evening;
    document.getElementById("today-date").textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(new Date());

    gardenLightSelect.value = ["bright", "medium", "low"].indexOf(savedGardenLight) !== -1 ? savedGardenLight : "bright";
    Array.from(new Set(SHOP_LISTINGS.map(function (listing) { return listing.shop; }))).forEach(function (shop) {
      const option = document.createElement("option");
      option.value = shop;
      option.textContent = shop;
      shopFilter.append(option);
    });

    document.getElementById("add-plant-button").addEventListener("click", function () { openPlantDialog(null); });
    document.getElementById("empty-add-button").addEventListener("click", function () { openPlantDialog(null); });
    document.getElementById("close-dialog").addEventListener("click", function () { plantDialog.close(); });
    document.getElementById("cancel-dialog").addEventListener("click", function () { plantDialog.close(); });
    plantForm.addEventListener("submit", savePlant);
    morningInput.addEventListener("change", saveReminderTimes);
    eveningInput.addEventListener("change", saveReminderTimes);
    gardenLightSelect.addEventListener("change", function () {
      savedGardenLight = gardenLightSelect.value;
      storage.set(gardenLightStorageKey, savedGardenLight);
      renderShopListings();
    });
    shopFilter.addEventListener("change", renderShopListings);
    compatibleOnly.addEventListener("change", renderShopListings);
    notificationButton.addEventListener("click", toggleNotifications);
    updateNotificationButton();
    render();
    checkReminderTime();
    window.setInterval(checkReminderTime, 30000);
  }

  setup();
})();