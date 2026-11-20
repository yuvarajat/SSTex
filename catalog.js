import { databaseError, requireAccount } from "./firebase.js";
import { fillCustomer, readCustomer, validateCustomer } from "./invoice-data.js";

const pageStatus = document.getElementById("pageStatus");
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

function showStatus(element, message, loading = false) {
  element.textContent = message;
  element.classList.toggle("is-loading", loading);
  element.hidden = !message;
}

function setupCatalog({ database, databaseSdk }, { path, form, label, read, fill, title, summary }) {
  const { onValue, push, ref, set } = databaseSdk;
  const collection = ref(database, path);
  const section = form.closest("section");
  const list = section.querySelector("[data-records]");
  const listStatus = section.querySelector("[data-list-status]");
  const formStatus = form.querySelector("[data-form-status]");
  const saveButton = form.querySelector('button[type="submit"]');
  const cancelButton = form.querySelector("[data-cancel]");
  let editingId = null;

  function stopEditing() {
    editingId = null;
    form.reset();
    for (const field of form.elements) field.setCustomValidity?.("");
    cancelButton.hidden = true;
    saveButton.textContent = `Save ${label}`;
  }

  form.addEventListener("input", (event) => {
    event.target.setCustomValidity?.("");
    if (event.target.name === "gstin") event.target.value = event.target.value.toUpperCase();
  });

  cancelButton.addEventListener("click", () => {
    stopEditing();
    showStatus(formStatus, "");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const record = read(form);
    if (!record) return;

    const destination = editingId ? ref(database, `${path}/${editingId}`) : push(collection);
    const fields = [...form.elements];
    fields.forEach((field) => { field.disabled = true; });
    list.inert = true;
    showStatus(formStatus, `Saving ${label} to Firebase…`, true);
    try {
      await set(destination, record);
      stopEditing();
      showStatus(formStatus, `${label === "customer" ? "Customer" : "Service"} saved.`);
    } catch (error) {
      showStatus(formStatus, databaseError(error, `Could not save the ${label}. Try again.`));
    } finally {
      fields.forEach((field) => { field.disabled = false; });
      list.inert = false;
    }
  });

  onValue(collection, (snapshot) => {
    const records = Object.entries(snapshot.val() ?? {});
    records.sort(([, first], [, second]) => title(first).localeCompare(title(second)));
    list.replaceChildren(...records.map(([id, record]) => {
      const item = document.createElement("li");
      const details = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = title(record);
      const metadata = document.createElement("small");
      metadata.textContent = summary(record);
      details.append(heading, metadata);

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "button button-secondary";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit ${title(record)}`);
      editButton.addEventListener("click", () => {
        stopEditing();
        editingId = id;
        fill(form, record);
        cancelButton.hidden = false;
        saveButton.textContent = "Save changes";
        showStatus(formStatus, "");
        form.elements[0].focus();
      });

      item.append(details, editButton);
      return item;
    }));
    showStatus(listStatus, records.length ? "" : `No saved ${path} yet.`);
  }, (error) => {
    showStatus(listStatus, databaseError(error, `Could not load ${path}. Check your connection and reload.`));
  });
}

async function start() {
  const firebase = await requireAccount();
  if (!firebase) return;

  const form = document.querySelector(".catalog-grid form");
  const catalog = form.id === "customerForm" ? {
    path: "customers",
    label: "customer",
    read: (form) => {
      const customer = readCustomer(form);
      return validateCustomer(form, customer) ? customer : null;
    },
    fill: fillCustomer,
    title: (customer) => customer.name,
    summary: (customer) => `${customer.gstin} · ${customer.placeOfSupply}`,
  } : {
    path: "services",
    label: "service",
    read: (form) => {
      const { description, hsn, rate, gstPercent } = form.elements;
      description.setCustomValidity(description.value.trim() ? "" : "Enter the service description.");
      if (!form.reportValidity()) return null;
      return {
        description: description.value.trim(),
        hsn: hsn.value,
        rate: rate.valueAsNumber,
        gstPercent: gstPercent.valueAsNumber,
      };
    },
    fill: (form, service) => {
      for (const [field, value] of Object.entries(service)) form.elements[field].value = value;
    },
    title: (service) => service.description,
    summary: (service) => `${rupees.format(service.rate)} · HSN/SAC ${service.hsn} · GST ${service.gstPercent}%`,
  };
  setupCatalog(firebase, { ...catalog, form });

  document.querySelector("[data-private]").hidden = false;
  showStatus(pageStatus, "");
}

start().catch((error) => showStatus(pageStatus, error.message));
