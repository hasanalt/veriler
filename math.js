function formatMoney(n) {
  // Kontrol: Giriş sayısal bir değer mi?
  n = String(n).replace(/[^0-9.,]/g, ''); // Sadece sayılar, nokta ve virgülü tut

  if (n === null || n === undefined || n === "" ) {
      return ""; // Fonksiyonu burada sonlandır
  }
  // Convert the number to a string
  let str = String(n);

  // Check if the string contains a comma (",")
  if (str.includes(',')) {
      // If comma exists, split the string to separate integer and decimal parts
      let parts = str.split(',');

      // Integer part (before the comma)
      let integerPart = parts[0];

      // Decimal part (after the comma)
      let decimalPart = parts[1] || '';

      // Format the currency string with existing comma and decimal part
      // Add thousand separators to the integer part
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

      // Ensure the decimal part has exactly two digits
      decimalPart = decimalPart.padEnd(2, '0').slice(0, 2);

      // Combine integer and decimal parts with comma
      let formatted = integerPart + ',' + decimalPart;

      return formatted;
  } else {
      // No comma in the input, assume it's a number with decimal places
      // Split the number into integer and decimal parts
      let parts = str.split('.');

      // Integer part (before the decimal point)
      let integerPart = parts[0];

      // Decimal part (after the decimal point, if exists)
      let decimalPart = parts[1] || '00'; // Default to '00' if no decimal part

      // Add thousand separators to the integer part
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

      // Ensure the decimal part has exactly two digits
      decimalPart = decimalPart.padEnd(2, '0').slice(0, 2);

      // Format the currency string with comma as decimal separator
      let formatted = integerPart + ',' + decimalPart;

      return formatted;
  }
}


let currentSortColumnIndex = null; // Şu anki sıralanan sütunun indeksi
let currentSortDirection = true; // true: büyükten küçüğe, false: küçükten büyüğe

function updateTable()
{

  const table = document.getElementById('dataTable');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  // Boş satırları ayırın ve dolu satırları sıralayın
  const nonEmptyRows = rows.filter(row => {
      const cellText = row.cells[currentSortColumnIndex].textContent.trim();
      return cellText !== '';
  });

  // Sadece dolu satırları sıralayın
  nonEmptyRows.sort((rowA, rowB) => {
      const cellA = normalizeTurkishNumber(rowA.cells[currentSortColumnIndex].textContent.trim());
      const cellB = normalizeTurkishNumber(rowB.cells[currentSortColumnIndex].textContent.trim());

      const valueA = isNaN(cellA) ? cellA.toLowerCase() : parseFloat(cellA);
      const valueB = isNaN(cellB) ? cellB.toLowerCase() : parseFloat(cellB);

      if (currentSortDirection) {
          return compareValues(valueA, valueB); // Büyükten küçüğe doğru sırala
      } else {
          return compareValues(valueB, valueA); // Küçükten büyüğe doğru sırala
      }
  });

  // Boş satırları tablonun en altına ekleyin
  const emptyRows = rows.filter(row => {
      const cellText = row.cells[currentSortColumnIndex].textContent.trim();
      return cellText === '';
  });

  // Dolu satırları yerlerine yerleştirin
  tbody.innerHTML = '';
  nonEmptyRows.forEach(row => {
      tbody.appendChild(row);
  });

  // Boş satırları tablonun en sonuna ekleyin
  emptyRows.forEach(row => {
      tbody.appendChild(row);
  });

}


function sortTable(columnIndex) {
  const table = document.getElementById('dataTable');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));


  // Yeni tıklanan sütun indeksi, mevcut sıralama sütun indeksinden farklı ise
  if (currentSortColumnIndex !== columnIndex) {
      // Sıralama ayarlarını sıfırla
      clearInterval(updateTable);

  currentSortColumnIndex = columnIndex;
  currentSortDirection = true;
  }

  // Boş satırları ayırın ve dolu satırları sıralayın
  const nonEmptyRows = rows.filter(row => {
      const cellText = row.cells[columnIndex].textContent.trim();
      return cellText !== '';
  });

  // Sadece dolu satırları sıralayın
  nonEmptyRows.sort((rowA, rowB) => {
      const cellA = normalizeTurkishNumber(rowA.cells[columnIndex].textContent.trim());
      const cellB = normalizeTurkishNumber(rowB.cells[columnIndex].textContent.trim());

      const valueA = isNaN(cellA) ? cellA.toLowerCase() : parseFloat(cellA);
      const valueB = isNaN(cellB) ? cellB.toLowerCase() : parseFloat(cellB);

      if (currentSortDirection) {
          return compareValues(valueB, valueA); // Büyükten küçüğe doğru sırala
      } else {
          return compareValues(valueA, valueB); // Küçükten büyüğe doğru sırala
      }
  });

  // Boş satırları tablonun en altına ekleyin
  const emptyRows = rows.filter(row => {
      const cellText = row.cells[columnIndex].textContent.trim();
      return cellText === '';
  });

  // Dolu satırları yerlerine yerleştirin
  tbody.innerHTML = '';
  nonEmptyRows.forEach(row => {
      tbody.appendChild(row);
  });

  // Boş satırları tablonun en sonuna ekleyin
  emptyRows.forEach(row => {
      tbody.appendChild(row);
  });

  // Sıralama yönünü değiştir
  currentSortDirection = !currentSortDirection;

  setInterval(updateTable, 1000);

}



// Değerleri karşılaştırma fonksiyonu
function compareValues(valueA, valueB) {
  if (valueA < valueB) {
      return -1;
  }
  if (valueA > valueB) {
      return 1;
  }
  return 0;
}

// Türkçe sayı formatını normalize etme fonksiyonu
function normalizeTurkishNumber(numString) {
  // Türkçe stilde virgülle ayrılan ondalık sayıyı parseFloat için uygun formata dönüştürme
  // Örneğin: "1.234,56" => "1234.56"
  return numString.replace(/\./g, '').replace(',', '.');
}


function turkishNumberToFloat(value) {
  // Türkçe sayı formatındaki virgül ve noktaları düzelt
  const normalizedValue = value.replace(/\./g, '').replace(',', '.');

  // Sayıya dönüştür ve geri döndür
  return parseFloat(normalizedValue);
}


function parseTurkishInteger(value) {
  // Check if the value is a string
  if (typeof value === 'string') {
    // Remove all dots and parse as integer
    const parsedValue = parseInt(value.replace(/\./g, ''), 10);
    return parsedValue;
  } else {
    // If the value is not a string, return it directly
    return value;
  }
}


// Export all functions as a single object
module.exports = {
    formatMoney,
    updateTable,
    sortTable,
    compareValues,
    normalizeTurkishNumber,
    turkishNumberToFloat,
    parseTurkishInteger

};