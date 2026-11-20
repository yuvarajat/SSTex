export const MAX_ITEMS = 10;
const MAX_TOTAL = 999999999999;

const placesOfSupply = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Orissa",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh",
  "97": "Other Territories",
};

export function readCustomer(form) {
  const { customerName, customerAddress, gstin } = form.elements;
  const gstNumber = gstin.value.trim().toUpperCase();
  return {
    name: customerName.value.trim(),
    address: customerAddress.value.trim(),
    gstin: gstNumber,
    placeOfSupply: placesOfSupply[gstNumber.slice(0, 2)] ?? "",
  };
}

export function fillCustomer(form, customer) {
  form.elements.customerName.value = customer.name;
  form.elements.customerAddress.value = customer.address;
  form.elements.gstin.value = customer.gstin;
}

export function validateCustomer(form, customer) {
  form.elements.customerName.setCustomValidity(customer.name ? "" : "Enter the customer name.");
  form.elements.customerAddress.setCustomValidity(customer.address ? "" : "Enter the billing address.");
  form.elements.gstin.setCustomValidity(customer.placeOfSupply ? "" : "Enter a GSTIN with a recognized state code.");
  return form.reportValidity();
}

export function financialYearSuffix(date) {
  const [year, month] = date.split("-").map(Number);
  const start = month < 4 ? year - 1 : year;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

export function invoiceKey(invoiceNo) {
  return encodeURIComponent(invoiceNo).replaceAll(".", "%2E");
}

export function formatInvoiceDate(date) {
  return date.split("-").reverse().join("-");
}

export function calculateLineAmount(rate, quantity) {
  const ratePaise = Math.round(rate * 100);
  const wholeQuantity = Math.trunc(quantity);
  const thousandths = Math.round((quantity - wholeQuantity) * 1000);
  const amountPaise = wholeQuantity * ratePaise + Math.round(thousandths * ratePaise / 1000);
  return amountPaise / 100;
}

export function calculateTotals(items, interState) {
  // For local invoices, divide the GST rate across CGST and SGST before rounding.
  const taxDivisor = interState ? 10000 : 20000;
  let subtotalPaise = 0;
  let wholeTaxPaise = 0;
  let fractionalTax = 0;
  for (const { amount, gstPercent } of Object.values(items)) {
    const amountPaise = Math.round(amount * 100);
    const basisPoints = Math.round(gstPercent * 100);
    subtotalPaise += amountPaise;
    wholeTaxPaise += Math.floor(amountPaise / taxDivisor) * basisPoints;
    fractionalTax += (amountPaise % taxDivisor) * basisPoints;
  }

  const taxPaise = wholeTaxPaise + Math.round(fractionalTax / taxDivisor);
  const igstPaise = interState ? taxPaise : 0;
  const localTaxPaise = interState ? 0 : taxPaise;
  const grandTotal = Math.round((subtotalPaise + igstPaise + localTaxPaise * 2) / 100);
  const totalIsValid = Number.isSafeInteger(grandTotal) && grandTotal <= MAX_TOTAL
    && subtotalPaise <= MAX_TOTAL * 100;

  return {
    subtotal: subtotalPaise / 100,
    igst: igstPaise / 100,
    cgst: localTaxPaise / 100,
    sgst: localTaxPaise / 100,
    grandTotal,
    amountInWords: totalIsValid ? numberToWords(grandTotal) : "",
  };
}

function numberToWords(number) {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ];
  const teens = [
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertLessThanOneThousand(n) {
    if (n === 0) {
      return "";
    } else if (n <= 10) {
      return units[n];
    } else if (n < 20) {
      return teens[n - 11];
    } else if (n < 100) {
      return tens[Math.floor(n / 10)] + " " + units[n % 10];
    } else {
      return (
        units[Math.floor(n / 100)] +
        " Hundred " +
        convertLessThanOneThousand(n % 100)
      );
    }
  }

  function convert(number) {
    if (number === 0) {
      return "Zero";
    }

    let result = "";
    let billion = Math.floor(number / 1000000000);
    let million = Math.floor((number % 1000000000) / 1000000);
    let thousand = Math.floor((number % 1000000) / 1000);
    let remainder = number % 1000;

    if (billion) {
      result += convertLessThanOneThousand(billion) + " Billion ";
    }

    if (million) {
      result += convertLessThanOneThousand(million) + " Million ";
    }

    if (thousand) {
      result += convertLessThanOneThousand(thousand) + " Thousand ";
    }

    if (remainder) {
      result += convertLessThanOneThousand(remainder);
    }

    return result.trim();
  }

  return convert(number);
}
