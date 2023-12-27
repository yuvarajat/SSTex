const form = document.getElementById("form");

// const millName = document.getElementById('millName');
// const millAddress = document.getElementById('millAddress');
// const millGSTIN = document.getElementById('millGSTIN');
// const invoiceNo = document.getElementById('invoiceNo');
// const invoiceDate = document.getElementById('invoiceDate');

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const millName = document.getElementById("millName").value;
  const millAddress = document.getElementById("millAddress").value;
  const millGSTIN = document.getElementById("millGSTIN").value;
  const invoiceNo = document.getElementById("invoiceNo").value;
  const invoiceDate = document.getElementById("invoiceDate").value;

  const sno1 = document.getElementById("sno1").value;
  const par1 = document.getElementById("par1").value;
  const hsn1 = document.getElementById("hsn1").value;
  const qty1 = document.getElementById("qty1").value;
  const rat1 = document.getElementById("rat1").value;
  const amo1 = document.getElementById("amo1").value;

  const sno2 = document.getElementById("sno2").value;
  const par2 = document.getElementById("par2").value;
  const hsn2 = document.getElementById("hsn2").value;
  const qty2 = document.getElementById("qty2").value;
  const rat2 = document.getElementById("rat2").value;
  const amo2 = document.getElementById("amo2").value;

  const sno3 = document.getElementById("sno3").value;
  const par3 = document.getElementById("par3").value;
  const hsn3 = document.getElementById("hsn3").value;
  const qty3 = document.getElementById("qty3").value;
  const rat3 = document.getElementById("rat3").value;
  const amo3 = document.getElementById("amo3").value;

  const sno4 = document.getElementById("sno4").value;
  const par4 = document.getElementById("par4").value;
  const hsn4 = document.getElementById("hsn4").value;
  const qty4 = document.getElementById("qty4").value;
  const rat4 = document.getElementById("rat4").value;
  const amo4 = document.getElementById("amo4").value;

  const sno5 = document.getElementById("sno5").value;
  const par5 = document.getElementById("par5").value;
  const hsn5 = document.getElementById("hsn5").value;
  const qty5 = document.getElementById("qty5").value;
  const rat5 = document.getElementById("rat5").value;
  const amo5 = document.getElementById("amo5").value;

  const sno6 = document.getElementById("sno6").value;
  const par6 = document.getElementById("par6").value;
  const hsn6 = document.getElementById("hsn6").value;
  const qty6 = document.getElementById("qty6").value;
  const rat6 = document.getElementById("rat6").value;
  const amo6 = document.getElementById("amo6").value;

  const sno7 = document.getElementById("sno7").value;
  const par7 = document.getElementById("par7").value;
  const hsn7 = document.getElementById("hsn7").value;
  const qty7 = document.getElementById("qty7").value;
  const rat7 = document.getElementById("rat7").value;
  const amo7 = document.getElementById("amo7").value;

  const sno8 = document.getElementById("sno8").value;
  const par8 = document.getElementById("par8").value;
  const hsn8 = document.getElementById("hsn8").value;
  const qty8 = document.getElementById("qty8").value;
  const rat8 = document.getElementById("rat8").value;
  const amo8 = document.getElementById("amo8").value;

  const sno9 = document.getElementById("sno9").value;
  const par9 = document.getElementById("par9").value;
  const hsn9 = document.getElementById("hsn9").value;
  const qty9 = document.getElementById("qty9").value;
  const rat9 = document.getElementById("rat9").value;
  const amo9 = document.getElementById("amo9").value;

  const sno10 = document.getElementById("sno10").value;
  const par10 = document.getElementById("par10").value;
  const hsn10 = document.getElementById("hsn10").value;
  const qty10 = document.getElementById("qty10").value;
  const rat10 = document.getElementById("rat10").value;
  const amo10 = document.getElementById("amo10").value;

  localStorage.setItem("millName", millName);
  localStorage.setItem("millAddress", millAddress);
  localStorage.setItem("millGSTIN", millGSTIN);
  localStorage.setItem("invoiceNo", invoiceNo);
  localStorage.setItem("invoiceDate", invoiceDate);

  localStorage.setItem("sno1", sno1);
  localStorage.setItem("par1", par1);
  localStorage.setItem("hsn1", hsn1);
  localStorage.setItem("qty1", qty1);
  localStorage.setItem("rat1", rat1);
  localStorage.setItem("amo1", amo1);

  localStorage.setItem("sno2", sno2);
  localStorage.setItem("par2", par2);
  localStorage.setItem("hsn2", hsn2);
  localStorage.setItem("qty2", qty2);
  localStorage.setItem("rat2", rat2);
  localStorage.setItem("amo2", amo2);

  localStorage.setItem("sno3", sno3);
  localStorage.setItem("par3", par3);
  localStorage.setItem("hsn3", hsn3);
  localStorage.setItem("qty3", qty3);
  localStorage.setItem("rat3", rat3);
  localStorage.setItem("amo3", amo3);

  localStorage.setItem("sno4", sno4);
  localStorage.setItem("par4", par4);
  localStorage.setItem("hsn4", hsn4);
  localStorage.setItem("qty4", qty4);
  localStorage.setItem("rat4", rat4);
  localStorage.setItem("amo4", amo4);

  localStorage.setItem("sno5", sno5);
  localStorage.setItem("par5", par5);
  localStorage.setItem("hsn5", hsn5);
  localStorage.setItem("qty5", qty5);
  localStorage.setItem("rat5", rat5);
  localStorage.setItem("amo5", amo5);

  localStorage.setItem("sno6", sno6);
  localStorage.setItem("par6", par6);
  localStorage.setItem("hsn6", hsn6);
  localStorage.setItem("qty6", qty6);
  localStorage.setItem("rat6", rat6);
  localStorage.setItem("amo6", amo6);

  localStorage.setItem("sno7", sno7);
  localStorage.setItem("par7", par7);
  localStorage.setItem("hsn7", hsn7);
  localStorage.setItem("qty7", qty7);
  localStorage.setItem("rat7", rat7);
  localStorage.setItem("amo7", amo7);

  localStorage.setItem("sno8", sno8);
  localStorage.setItem("par8", par8);
  localStorage.setItem("hsn8", hsn8);
  localStorage.setItem("qty8", qty8);
  localStorage.setItem("rat8", rat8);
  localStorage.setItem("amo8", amo8);

  localStorage.setItem("sno9", sno9);
  localStorage.setItem("par9", par9);
  localStorage.setItem("hsn9", hsn9);
  localStorage.setItem("qty9", qty9);
  localStorage.setItem("rat9", rat9);
  localStorage.setItem("amo9", amo9);

  localStorage.setItem("sno10", sno10);
  localStorage.setItem("par10", par10);
  localStorage.setItem("hsn10", hsn10);
  localStorage.setItem("qty10", qty10);
  localStorage.setItem("rat10", rat10);
  localStorage.setItem("amo10", amo10);

  window.location.href = "bill.html";
});

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
    } else if (n < 10) {
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

function calculate(event) {
  let targetId = event.target.id;
  let index = targetId.slice(3);

  let qtyId = `qty${index}`;
  let ratId = `rat${index}`;
  let amoId = `amo${index}`;

  let qtyInput = document.getElementById(qtyId);
  let ratInput = document.getElementById(ratId);
  let amoInput = document.getElementById(amoId);

  // Extract the numeric part from the input values
  let qtyValue = parseFloat(qtyInput.value) || 0; // Convert to float, default to 0 if not a valid number
  let ratValue = parseFloat(ratInput.value) || 0;

  let amount = qtyValue * ratValue;

  // Update the amount field
  amoInput.value = amount;
  calculateTA();
}

function calculateTA() {
  let total = 0;

  for (let i = 1; i <= 10; i++) {
    let amoId = `amo${i}`;
    let amoElement = document.getElementById(amoId);

    if (amoElement) {
      // Check if the element exists
      total += parseFloat(amoElement.value) || 0; // Convert to float, default to 0 if not a valid number
    }
  }

  const checkBox = document.getElementById("myCheckbox");

  document.getElementById("total").value = total.toFixed(2);
  if (checkBox.checked) {
    document.getElementById("igst").value = ((total * 18) / 100).toFixed(2);
    document.getElementById("cgst").value = 0;
    document.getElementById("sgst").value = 0;
  } else {
    document.getElementById("igst").value = 0;
    document.getElementById("cgst").value = ((total * 9) / 100).toFixed(2);
    document.getElementById("sgst").value = ((total * 9) / 100).toFixed(2);
  }

  const igst = Number(document.getElementById("igst").value);
  const cgst = Number(document.getElementById("cgst").value);
  const sgst = Number(document.getElementById("sgst").value);
  const totalAmount = Math.round((total + igst + cgst + sgst).toFixed(2));
  document.getElementById("totalAmount").value = totalAmount;

  localStorage.setItem("total", total);
  localStorage.setItem("igst", igst);
  localStorage.setItem("cgst", cgst);
  localStorage.setItem("sgst", sgst);
  localStorage.setItem("totalAmount", totalAmount);

  const amountInWords = numberToWords(totalAmount);
  localStorage.setItem("amountInWords", amountInWords);
  document.getElementById("amountInWords").value = amountInWords;
}


function updateHSN(event){
    let targetId = event.target.id;
    let index = targetId.slice(3);

    let hsnId = `hsn${index}`;

    let hsnInput = document.getElementById(hsnId);

    hsnInput.value = 9987;
}

function capitalizeFirstLetter(event) {
    var inputValue = event.target.value;

      // Capitalize the first letter of each word and update the input value
      var capitalizedValue = inputValue.replace(/\b\w/g, function(match) {
        return match.toUpperCase();
      });

      event.target.value = capitalizedValue;
  }

  function capitalizeAllLetters(event) {
    // Access the current value of the input element
    var inputValue = event.target.value;

    // Capitalize all letters and update the input value
    var capitalizedValue = inputValue.toUpperCase();

    event.target.value = capitalizedValue;
  }