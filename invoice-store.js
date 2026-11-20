import { invoiceKey, MAX_ITEMS } from "./invoice-data.js";

function pendingPrefix(uid) {
  return `sstex:pending:${uid}:`;
}

export function queueInvoice(uid, invoice) {
  localStorage.setItem(pendingPrefix(uid) + invoice.submissionId, JSON.stringify(invoice));
}

export function readPendingInvoice(uid, submissionId) {
  const value = localStorage.getItem(pendingPrefix(uid) + submissionId);
  return value ? JSON.parse(value) : null;
}

export function removePendingInvoice(uid, submissionId) {
  localStorage.removeItem(pendingPrefix(uid) + submissionId);
}

export function listPendingInvoices(uid) {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(pendingPrefix(uid)))
    .map((key) => readPendingInvoice(uid, key.slice(pendingPrefix(uid).length)))
    .filter(Boolean)
    .sort((first, second) => second.queuedAt - first.queuedAt);
}

export function invoiceLink(value, pending = false) {
  const params = new URLSearchParams({ [pending ? "pending" : "id"]: value });
  return `bill.html?${params}`;
}

export async function saveInvoice({ database, databaseSdk }, invoice) {
  const { get, ref, serverTimestamp, set } = databaseSdk;
  const reference = ref(database, `invoices/${invoiceKey(invoice.invoiceNo)}`);
  const { queuedAt, ...record } = invoice;
  try {
    await set(reference, { ...record, savedAt: serverTimestamp() });
  } catch (error) {
    const existing = await get(reference).catch(() => null);
    if (existing?.val()?.submissionId === invoice.submissionId) return;
    if (existing?.exists()) {
      throw Object.assign(new Error("An invoice with this number is already saved."), {
        code: "duplicate-invoice",
      });
    }
    throw error;
  }
}

export function readLegacyInvoice() {
  const value = (key) => localStorage.getItem(key) ?? "";
  if (!value("invoiceNo") || !value("invoiceDate")) return null;

  const items = {};
  for (let row = 1; row <= MAX_ITEMS; row++) {
    items[row] = {
      serial: value(`sno${row}`),
      description: value(`par${row}`),
      hsn: value(`hsn${row}`),
      rate: value(`rat${row}`),
      quantity: value(`qty${row}`),
      amount: value(`amo${row}`),
    };
  }

  return {
    invoiceNo: `${value("invoiceNo")}/26-27`,
    invoiceDate: value("invoiceDate"),
    customer: {
      name: value("millName"),
      address: value("millAddress"),
      gstin: value("millGSTIN"),
      placeOfSupply: value("placeOfSupply"),
    },
    items,
    totals: {
      subtotal: value("total"),
      igst: value("igst"),
      cgst: value("cgst"),
      sgst: value("sgst"),
      grandTotal: value("totalAmount"),
      amountInWords: value("amountInWords"),
    },
  };
}
