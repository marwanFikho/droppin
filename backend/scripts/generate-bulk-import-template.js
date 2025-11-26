const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Define the header row exactly as agreed
const HEADERS = [
  'PACKAGE_REFERENCE',
  'PACKAGE_DESCRIPTION',
  'WEIGHT_KG',
  'CUSTOMER_NAME',
  'CUSTOMER_PHONE',
  'DELIVERY_ADDRESS',
  'SHOP_NOTE',
  'ITEM_DESCRIPTION',
  'ITEM_QUANTITY',
  'ITEM_UNIT_PRICE'
];

function createTemplateWorkbook() {
  // Sheet 1: Packages
  const packagesData = [HEADERS];
  const packagesSheet = XLSX.utils.aoa_to_sheet(packagesData);

  // Basic column widths for readability
  const colWidths = [
    { wch: 18 }, // PACKAGE_REFERENCE
    { wch: 30 }, // PACKAGE_DESCRIPTION
    { wch: 10 }, // WEIGHT_KG
    { wch: 20 }, // CUSTOMER_NAME
    { wch: 18 }, // CUSTOMER_PHONE
    { wch: 40 }, // DELIVERY_ADDRESS
    { wch: 30 }, // SHOP_NOTE
    { wch: 25 }, // ITEM_DESCRIPTION
    { wch: 14 }, // ITEM_QUANTITY
    { wch: 16 }  // ITEM_UNIT_PRICE
  ];
  packagesSheet['!cols'] = colWidths;

  // Sheet 2: Instructions
  const instructionsText = [
    ['Bulk Package Import Instructions'],
    [''],
    ['1. General rules'],
    ['- Each row represents one item in a package.'],
    ['- Packages are grouped by the column PACKAGE_REFERENCE.'],
    ['- For each unique PACKAGE_REFERENCE, the system creates one package with one or more items.'],
    ['- Do not change the column headers in the "Packages" sheet.'],
    [''],
    ['2. Package-level fields (fill once per package)'],
    ['For every new package (new PACKAGE_REFERENCE), fill these columns only on the first row of that package:'],
    ['- PACKAGE_REFERENCE – your own order/package reference (must be unique per package in this file).'],
    ['- PACKAGE_DESCRIPTION – a short description of the shipment.'],
    ['- WEIGHT_KG – package weight in kilograms (optional).'],
    ['- CUSTOMER_NAME – receiver’s full name.'],
    ['- CUSTOMER_PHONE – receiver’s phone number.'],
    ['- DELIVERY_ADDRESS – full delivery address.'],
    ['- SHOP_NOTE – optional note for this package (you can leave it blank).'],
    ['On additional rows for the same PACKAGE_REFERENCE, you may leave these columns blank.'],
    [''],
    ['3. Item-level fields (fill on every row)'],
    ['For every row:'],
    ['- ITEM_DESCRIPTION – name/description of the item.'],
    ['- ITEM_QUANTITY – how many units of this item (must be a positive number).'],
    ['- ITEM_UNIT_PRICE – price for one unit of this item (without shipping fees).'],
    [''],
    ['4. Multiple items in the same package'],
    ['To add multiple items to the same package:'],
    ['- Repeat the same value in PACKAGE_REFERENCE on multiple rows in the Packages sheet.'],
    ['- On the first row of that reference, fill all package-level fields and the item fields.'],
    ['- On next rows with the same PACKAGE_REFERENCE, you can leave package-level columns blank and fill only ITEM_DESCRIPTION, ITEM_QUANTITY, and ITEM_UNIT_PRICE.'],
    [''],
    ['5. COD calculation'],
    ['- The system will calculate the package COD amount automatically as the sum of ITEM_QUANTITY × ITEM_UNIT_PRICE for all rows with the same PACKAGE_REFERENCE.'],
    ['- Do not include shipping fees in the item prices.'],
    [''],
    ['6. Validation and errors'],
    ['- During import, rows with missing or invalid required fields may be skipped.'],
    ['- The system will then show the valid packages and items (which you can review and edit) and a list of rows/packages with errors.'],
    [''],
    ['7. Tips'],
    ['- Keep one file per import.'],
    ['- Avoid merging cells or adding extra columns.'],
    ['- Do not add extra header rows above the main header in the Packages sheet.']
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsText);
  instructionsSheet['!cols'] = [{ wch: 120 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, packagesSheet, 'Packages');
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

  return wb;
}

function main() {
  const outputDir = path.join(__dirname, '..', 'assets', 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'droppin_bulk_package_import_template.xlsx');
  const workbook = createTemplateWorkbook();

  XLSX.writeFile(workbook, outputPath);

  console.log(`Template generated at: ${outputPath}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  createTemplateWorkbook,
};
