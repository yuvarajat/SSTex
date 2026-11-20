import { databaseError, requireAccount } from "./firebase.js";
import {
  calculateLineAmount, calculateTotals, fillCustomer, financialYearSuffix,
  invoiceKey, MAX_ITEMS, readCustomer, validateCustomer,
} from "./invoice-data.js";
import {
  invoiceLink, queueInvoice, readPendingInvoice, removePendingInvoice, saveInvoice,
} from "./invoice-store.js";

const form = document.getElementById("form");
const pageStatus = document.getElementById("pageStatus");
const formStatus = document.getElementById("formStatus");
const customerPicker = document.getElementById("customerPicker");
const invoiceDate = document.getElementById("invoiceDate");
const invoiceNo = document.getElementById("invoiceNo");
const gstin = form.elements.gstin;
const interState = document.getElementById("myCheckbox");
const lineItems = document.getElementById("lineItems");
const addLine = document.getElementById("addLine");
const resetButton = document.getElementById("resetInvoice");
const resetDialog = document.getElementById("resetInvoiceDialog");
const rows = [];
let visibleLines = 1;

function status(element, message, loading = false) {
  element.textContent = message;
  element.classList.toggle("is-loading", loading);
  element.hidden = !message;
}

function refreshCustomer() {
  const { placeOfSupply } = readCustomer(form);
  document.getElementById("placeOfSupply").value = placeOfSupply;
  interState.checked = Boolean(placeOfSupply && placeOfSupply !== "Tamil Nadu");
  refreshTotals();
}

function createRows() {
  const template = document.getElementById("lineTemplate");
  for (let number = 1; number <= MAX_ITEMS; number++) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector("[data-serial]").textContent = number;
    const fields = {};
    for (const field of row.querySelectorAll("[data-field]")) {
      fields[field.dataset.field] = field;
      field.setAttribute("aria-label", `${field.getAttribute("aria-label")}, line ${number}`);
    }
    rows.push(fields);
    lineItems.append(row);
  }
  showLines(visibleLines);
}

function showLines(count) {
  visibleLines = count;
  for (const [index, row] of Array.from(lineItems.rows).entries()) {
    row.hidden = index >= count;
  }
  addLine.hidden = count === MAX_ITEMS;
}

function readItems(validate = false) {
  const items = {};
  rows.forEach((row, index) => {
    const description = row.description.value.trim();
    const hsn = row.hsn.value.trim();
    const hasEntry = Boolean(row.description.value || row.rate.value || row.quantity.value);
    if (validate && hasEntry) {
      row.description.setCustomValidity(description ? "" : "Enter the service description.");
      row.hsn.setCustomValidity(hsn ? "" : "Enter the HSN/SAC code.");
      row.rate.setCustomValidity(row.rate.value ? "" : "Enter the rate.");
      row.quantity.setCustomValidity(row.quantity.value ? "" : "Enter the quantity.");
      row.gstPercent.setCustomValidity(row.gstPercent.value ? "" : "Enter a GST percentage.");
    }

    const amount = calculateLineAmount(Number(row.rate.value), Number(row.quantity.value));
    row.amount.value = row.rate.value && row.quantity.value ? amount : "";
    if (hasEntry) {
      items[index + 1] = {
        description, hsn, rate: Number(row.rate.value), quantity: Number(row.quantity.value),
        gstPercent: Number(row.gstPercent.value), amount,
      };
    }
  });
  return items;
}

function refreshTotals() {
  const totals = calculateTotals(readItems(), interState.checked);
  for (const [field, value] of Object.entries({
    total: totals.subtotal.toFixed(2),
    igst: interState.checked ? totals.igst.toFixed(2) : "0",
    cgst: interState.checked ? "0" : totals.cgst.toFixed(2),
    sgst: interState.checked ? "0" : totals.sgst.toFixed(2),
    totalAmount: totals.grandTotal,
    amountInWords: totals.amountInWords,
  })) {
    document.getElementById(field).value = value;
  }
}

function refreshFinancialYear() {
  document.getElementById("yearSuffix").textContent =
    invoiceDate.value ? `/${financialYearSuffix(invoiceDate.value)}` : "";
}

function restorePending(invoice) {
  fillCustomer(form, invoice.customer);
  invoiceNo.value = invoice.invoiceNo.replace(/\/\d{2}-\d{2}$/, "");
  invoiceDate.value = invoice.invoiceDate;
  refreshFinancialYear();
  refreshCustomer();
  interState.checked = invoice.interState;
  const items = Object.entries(invoice.items);
  showLines(Math.max(1, ...items.map(([index]) => Number(index))));
  for (const [index, item] of items) {
    const row = rows[Number(index) - 1];
    for (const key of ["description", "hsn", "rate", "quantity", "gstPercent"]) {
      row[key].value = item[key];
    }
  }
  refreshTotals();
}

function populatePicker(picker, records, label, emptyLabel) {
  const selected = picker.value;
  const options = Object.entries(records).sort(([, first], [, second]) =>
    label(first).localeCompare(label(second)));
  picker.replaceChildren(
    new Option(emptyLabel, ""),
    ...options.map(([key, value]) => new Option(label(value), key)),
  );
  if (Object.hasOwn(records, selected)) picker.value = selected;
  picker.disabled = options.length === 0;
}

function watchCatalog(firebase) {
  const { database, databaseSdk } = firebase;
  const catalogStatus = document.getElementById("catalogStatus");
  const { onValue, ref } = databaseSdk;
  let customers = {};
  let services = {};
  const handleError = (error) => status(catalogStatus,
    databaseError(error, "Could not load saved customers or services. You can still enter details manually."));

  onValue(ref(database, "customers"), (snapshot) => {
    customers = snapshot.val() ?? {};
    populatePicker(customerPicker, customers, (customer) => customer.name, "Enter details manually");
  }, handleError);
  customerPicker.addEventListener("change", () => {
    const customer = customers[customerPicker.value];
    if (!customer) return;
    fillCustomer(form, customer);
    form.elements.customerName.setCustomValidity("");
    form.elements.customerAddress.setCustomValidity("");
    gstin.setCustomValidity("");
    refreshCustomer();
  });

  onValue(ref(database, "services"), (snapshot) => {
    services = snapshot.val() ?? {};
    for (const { service } of rows) {
      populatePicker(service, services, (item) => item.description, "Enter service manually");
    }
  }, handleError);
  for (const row of rows) {
    row.service.addEventListener("change", () => {
      const item = services[row.service.value];
      if (!item) return;
      for (const key of ["description", "hsn", "rate", "gstPercent"]) {
        row[key].value = item[key];
        row[key].setCustomValidity("");
      }
      if (!row.quantity.value) row.quantity.value = 1;
      row.quantity.setCustomValidity("");
      refreshTotals();
    });
  }
}

async function start() {
  const firebase = await requireAccount();
  if (!firebase) return;
  const { user } = firebase;
  createRows();
  const pendingId = new URLSearchParams(location.search).get("pending");
  if (pendingId) {
    try {
      const pending = readPendingInvoice(user.uid, pendingId);
      if (pending) restorePending(pending);
      else status(formStatus, "This device no longer has that pending invoice.");
    } catch {
      status(formStatus, "This device could not reopen the pending invoice.");
    }
  }
  watchCatalog(firebase);
  refreshTotals();
  document.querySelector("[data-private]").hidden = false;
  status(pageStatus, "");
  addLine.addEventListener("click", () => {
    showLines(visibleLines + 1);
    rows[visibleLines - 1].description.focus();
  });
  resetButton.addEventListener("click", () => {
    resetDialog.returnValue = "";
    resetDialog.showModal();
  });
  resetDialog.addEventListener("close", () => {
    if (resetDialog.returnValue === "reset") form.reset();
  });
  form.addEventListener("input", (event) => {
    const field = event.target;
    field.setCustomValidity?.("");
    if (field === gstin) {
      gstin.value = gstin.value.toUpperCase();
      refreshCustomer();
    } else if (field === invoiceDate) {
      refreshFinancialYear();
    } else {
      if (["customerName", "customerAddress"].includes(field.name) || field.dataset.field === "description") {
        field.value = field.value.replace(/\b\w/g, (letter) => letter.toUpperCase());
      }
      refreshTotals();
    }
  });
  form.addEventListener("reset", () => {
    setTimeout(() => {
      for (const field of form.elements) field.setCustomValidity?.("");
      showLines(1);
      refreshFinancialYear();
      refreshCustomer();
      status(formStatus, "");
    }, 0);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status(formStatus, "");
    const customer = readCustomer(form);
    const number = invoiceNo.value.trim();
    invoiceNo.setCustomValidity(number ? "" : "Enter the invoice number.");
    const items = readItems(true);
    if (!validateCustomer(form, customer)) return;
    if (!Object.keys(items).length) {
      status(formStatus, "Add at least one service before submitting.");
      rows[0].description.focus();
      return;
    }
    const totals = calculateTotals(items, interState.checked);
    if (!totals.amountInWords) {
      status(formStatus, "The total is too large. Check the rates and quantities.");
      return;
    }

    const invoice = {
      schemaVersion: 1,
      submissionId: crypto.randomUUID(),
      invoiceNo: `${number}/${financialYearSuffix(invoiceDate.value)}`,
      invoiceDate: invoiceDate.value,
      customer,
      items,
      interState: interState.checked,
      totals,
      queuedAt: Date.now(),
    };
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      queueInvoice(user.uid, invoice);
    } catch {
      status(formStatus, "Your browser could not save a copy. Keep this page open while the invoice saves…", true);
      try {
        await saveInvoice(firebase, invoice);
        location.assign(invoiceLink(invoiceKey(invoice.invoiceNo)));
      } catch (error) {
        status(formStatus, error.code === "duplicate-invoice" ? error.message
          : databaseError(error, "Could not save the invoice. Your details are still in the form."));
        button.disabled = false;
      }
      return;
    }

    if (pendingId) removePendingInvoice(user.uid, pendingId);
    location.assign(invoiceLink(invoice.submissionId, true));
  });
}

start().catch((error) => status(pageStatus, error.message));
