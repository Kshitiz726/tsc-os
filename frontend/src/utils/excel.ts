import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportToExcel(
  data: any[],
  columns: { header: string; key: string; width: number }[],
  sheetName: string,
  fileName: string
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;

  // Add Data
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Inter', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' } // Indigo-600
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Style Data Rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.font = { name: 'Inter', size: 11, color: { argb: 'FF334155' } }; // Slate-700
      row.alignment = { vertical: 'middle', horizontal: 'left' };
      row.height = 25;
      
      // Alternate row colors for readability
      if (rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // Slate-50
      }
    }

    // Add thin borders to all cells
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // Generate and save
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${fileName}.xlsx`);
}
