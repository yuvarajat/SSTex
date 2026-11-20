import { databaseError, requireAccount } from "./firebase.js";
import { fillCustomer, readCustomer, validateCustomer } from "./invoice-data.js";

const pageStatus = document.getElementById("pageStatus");
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

function showStatus(element, message, loading = false) {
  element.textContent = message;
  element.classList.toggle("is-loading", loading);
  element.hidden = !message;
}

function setupDeleteDialog(section, label, deleteRecord, onDeleted) {
  const dialog = document.createElement("dialog");
  dialog.className = "panel confirmation-dialog";
  dialog.setAttribute("aria-labelledby", "deleteRecordTitle");
  dialog.setAttribute("aria-describedby", "deleteRecordDescription");
  dialog.innerHTML = `
    <form class="field-stack">
      <h2 id="deleteRecordTitle"></h2>
      <p id="deleteRecordDescription" class="dialog-description"></p>
      <label class="field"><span>Type <strong>CONFIRM</strong> to delete</span>
        <input type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" autofocus required />
      </label>
      <p class="app-status" role="status" hidden></p>
      <div class="form-actions">
        <button type="button" class="button button-secondary">Cancel</button>
        <button type="submit" class="button button-danger" disabled>Delete</button>
      </div>
    </form>`;
  section.append(dialog);

  const form = dialog.querySelector("form");
  const input = form.querySelector("input");
  const status = form.querySelector('[role="status"]');
  const cancelButton = form.querySelector('button[type="button"]');
  const deleteButton = form.querySelector('button[type="submit"]');
  const confirmed = () => input.value === "CONFIRM";
  let recordId;

  dialog.querySelector("h2").textContent = `Delete ${label}?`;
  input.addEventListener("input", () => {
    deleteButton.disabled = !confirmed();
    showStatus(status, "");
  });
  cancelButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", (event) => {
    if (input.disabled) event.preventDefault();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!confirmed() || input.disabled) return;
    input.disabled = cancelButton.disabled = deleteButton.disabled = true;
    showStatus(status, `Deleting ${label}…`, true);
    try {
      await deleteRecord(recordId);
      dialog.close();
      onDeleted();
    } catch (error) {
      showStatus(status, databaseError(error, `Could not delete the ${label}. Try again.`));
    } finally {
      input.disabled = cancelButton.disabled = false;
      deleteButton.disabled = !confirmed();
    }
  });

  return (id, name) => {
    recordId = id;
    dialog.querySelector("#deleteRecordDescription").textContent = `“${name}” will be removed from your saved ${label === "customer" ? "customers" : "service items"}.`;
    form.reset();
    deleteButton.disabled = true;
    showStatus(status, "");
    dialog.showModal();
  };
}

function setupCatalog({ database, databaseSdk }, { path, form, label, read, fill, title, summary }) {
  const { onValue, push, ref, remove, runTransaction, set } = databaseSdk;
  const collection = ref(database, path);
  const section = form.closest("section");
  const list = section.querySelector("[data-records]");
  const listStatus = section.querySelector("[data-list-status]");
  const formStatus = form.querySelector("[data-form-status]");
  const saveButton = form.querySelector('button[type="submit"]');
  const cancelButton = form.querySelector("[data-cancel]");
  const itemLabel = label === "service" ? "service item" : label;
  const result = document.createElement("p");
  result.className = "app-status catalog-result";
  result.setAttribute("role", "status");
  result.tabIndex = -1;
  result.hidden = true;
  list.before(result);
  let editingId = null;

  function stopEditing() {
    editingId = null;
    form.reset();
    for (const field of form.elements) field.setCustomValidity?.("");
    cancelButton.hidden = true;
    saveButton.textContent = `Save ${label}`;
  }

  const openDeleteDialog = setupDeleteDialog(section, itemLabel, async (id) => {
    await remove(ref(database, `${path}/${id}`));
    if (editingId === id) {
      stopEditing();
      showStatus(formStatus, "");
    }
  }, () => {
    showStatus(result, `${itemLabel[0].toUpperCase()}${itemLabel.slice(1)} deleted.`);
    result.focus();
  });

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

    const fields = [...form.elements];
    fields.forEach((field) => { field.disabled = true; });
    list.inert = true;
    showStatus(formStatus, `Saving ${label} to Firebase…`, true);
    try {
      if (editingId) {
        const destination = ref(database, `${path}/${editingId}`);
        const edit = await runTransaction(destination, (current) => current ? record : undefined, {
          applyLocally: false,
        });
        if (!edit.committed) {
          showStatus(formStatus, `This ${itemLabel} was deleted. Cancel the edit to add a new one.`);
          return;
        }
      } else {
        await set(push(collection), record);
      }
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

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "button button-danger-outline";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete ${title(record)}`);
      deleteButton.addEventListener("click", () => {
        showStatus(result, "");
        openDeleteDialog(id, title(record));
      });

      const actions = document.createElement("div");
      actions.className = "catalog-actions";
      actions.append(editButton, deleteButton);
      item.append(details, actions);
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
