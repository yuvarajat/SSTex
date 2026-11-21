import { invoiceKey, ITEMS_PER_PAGE } from "./invoice-data.js";

function pendingPrefix(uid) {
  return `sstex:pending:${uid}:`;
}

export function readPendingInvoice(uid, submissionId) {
  const value = localStorage.getItem(pendingPrefix(uid) + submissionId);
  return value ? JSON.parse(value) : null;
}

function removePendingInvoice(uid, submissionId) {
  localStorage.removeItem(pendingPrefix(uid) + submissionId);
}

export function listPendingInvoices(uid) {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(pendingPrefix(uid)))
    .map((key) => readPendingInvoice(uid, key.slice(pendingPrefix(uid).length)))
    .filter(Boolean)
    .sort((first, second) => second.queuedAt - first.queuedAt);
}

function legacyDraftPrefix(uid) {
  return `sstex:draft:${uid}:`;
}

export function draftsPath(uid) {
  return `drafts/${uid}`;
}

export function watchInvoiceRecords({ database, databaseSdk }, path, render, onError) {
  const { onValue, orderByChild, query, ref } = databaseSdk;
  return onValue(query(ref(database, path), orderByChild("savedAt")), (snapshot) => {
    const records = [];
    snapshot.forEach((child) => {
      records.push({ id: child.key, invoice: child.val() });
    });
    render(records.reverse());
  }, onError);
}

function draftPath(uid, draftId) {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(draftId)) {
    throw new Error("Invalid draft link.");
  }
  return `${draftsPath(uid)}/${draftId}`;
}

function invoiceRecord({ schemaVersion, submissionId, invoiceNo, invoiceDate, customer, items, interState, totals }) {
  return { schemaVersion, submissionId, invoiceNo, invoiceDate, customer, items, interState, totals };
}

function draftChanged() {
  return Object.assign(new Error("This draft changed on another device. Open it from Invoice History to see the latest version."), {
    code: "draft-changed",
  });
}

export async function saveDraft({ database, databaseSdk, user }, draft, previousSubmissionId = null) {
  const { get, ref, serverTimestamp, set } = databaseSdk;
  const reference = ref(database, draftPath(user.uid, draft.draftId));
  try {
    await set(reference, {
      ...invoiceRecord(draft),
      invoiceKey: invoiceKey(draft.invoiceNo),
      previousPendingId: draft.previousPendingId ?? null,
      previousSubmissionId,
      savedAt: serverTimestamp(),
    });
  } catch (error) {
    const latest = await get(reference).catch(() => null);
    if (latest?.val()?.submissionId === draft.submissionId) return;
    if (latest && (latest.val()?.submissionId ?? null) !== previousSubmissionId) throw draftChanged();
    throw error;
  }
}

async function readOnlineDraft({ database, databaseSdk, user }, draftId) {
  const { get, ref } = databaseSdk;
  const snapshot = await get(ref(database, draftPath(user.uid, draftId)));
  return snapshot.exists() ? { ...snapshot.val(), draftId } : null;
}

async function migrateLegacyDraft(firebase, storage, key) {
  const draft = JSON.parse(storage.getItem(key));
  if (!draft) return null;
  const { database, databaseSdk } = firebase;
  const { get, ref } = databaseSdk;
  const finalized = await get(ref(database, `invoices/${invoiceKey(draft.invoiceNo)}`));
  let draftId = draft.draftId;
  if (finalized.val()?.submissionId === draft.submissionId) {
    draftId = null;
  } else {
    try {
      await saveDraft(firebase, draft);
    } catch (error) {
      if (error.code !== "draft-changed") throw error;
      // Preserve a local revision if the original draft already has newer online edits.
      draftId = draft.submissionId;
      await saveDraft(firebase, { ...draft, draftId });
    }
  }
  if (JSON.parse(storage.getItem(key))?.submissionId === draft.submissionId) storage.removeItem(key);
  return draftId;
}

export async function migrateLocalDrafts(firebase) {
  const prefix = legacyDraftPrefix(firebase.user.uid);
  for (const storage of [localStorage, sessionStorage]) {
    const keys = Object.keys(storage).filter((key) => key.startsWith(prefix));
    const results = await Promise.allSettled(keys.map((key) => migrateLegacyDraft(firebase, storage, key)));
    if (results.some((result) => result.status === "rejected")) {
      throw new Error("Some drafts from this browser could not sync. Reload to try again.");
    }
  }
}

export async function readDraft(firebase, draftId, legacyPreview = false) {
  const key = legacyDraftPrefix(firebase.user.uid) + draftId;
  if (!legacyPreview) {
    const online = await readOnlineDraft(firebase, draftId);
    if (online) return online;
  }
  const migratedId = await migrateLegacyDraft(firebase, legacyPreview ? sessionStorage : localStorage, key);
  if (migratedId || legacyPreview) return readOnlineDraft(firebase, migratedId ?? draftId);
  return null;
}

export function clearFinalizedInvoice(uid, { draftId, queuedAt, previousPendingId, submissionId }) {
  try {
    removePendingInvoice(uid, submissionId);
    if (previousPendingId) removePendingInvoice(uid, previousPendingId);
    if (!draftId) return;
    const key = legacyDraftPrefix(uid) + draftId;
    for (const storage of [sessionStorage, localStorage]) {
      const stored = JSON.parse(storage.getItem(key));
      if (stored?.submissionId === submissionId || (stored && stored.queuedAt <= queuedAt)) storage.removeItem(key);
    }
  } catch {
    // The invoice is saved even if this browser can no longer clear its local copies.
  }
}

export function draftLink(draftId, { edit = false } = {}) {
  const params = new URLSearchParams({ draft: draftId });
  return `${edit ? "calc.html" : "bill.html"}?${params}`;
}

export function invoiceLink(value, pending = false) {
  const params = new URLSearchParams({ [pending ? "pending" : "id"]: value });
  return `bill.html?${params}`;
}

export async function saveInvoice({ database, databaseSdk, user }, invoice, finalizeDraft = false) {
  const { get, ref, serverTimestamp, set, update } = databaseSdk;
  const path = `invoices/${invoiceKey(invoice.invoiceNo)}`;
  const draft = finalizeDraft && draftPath(user.uid, invoice.draftId);
  const record = { ...invoiceRecord(invoice), savedAt: serverTimestamp() };
  try {
    if (draft) await update(ref(database), { [path]: record, [draft]: null });
    else await set(ref(database, path), record);
  } catch (error) {
    const existing = await get(ref(database, path)).catch(() => null);
    if (existing?.val()?.submissionId === invoice.submissionId) return;
    if (existing?.exists()) {
      throw Object.assign(new Error("An invoice with this number is already saved."), {
        code: "duplicate-invoice",
      });
    }
    if (draft) {
      const latest = await get(ref(database, draft)).catch(() => null);
      if (latest && latest.val()?.submissionId !== invoice.submissionId) throw draftChanged();
    }
    throw error;
  }
}

export function readLegacyInvoice() {
  const value = (key) => localStorage.getItem(key) ?? "";
  if (!value("invoiceNo") || !value("invoiceDate")) return null;

  const items = {};
  for (let row = 1; row <= ITEMS_PER_PAGE; row++) {
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
