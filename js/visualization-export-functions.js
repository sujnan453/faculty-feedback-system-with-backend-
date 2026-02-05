// ADD THESE FUNCTIONS TO THE END OF visualization.js

// Export Functions for Faculty Report
function exportReportCSV() {
    if (!currentReportData || currentReportData.length === 0) {
        showAlert('No report data to export. Generate a report first.', 'warning');
        return;
    }

    const deptFilter = document.getElementById('reportDepartmentFilter') ? .value || 'All';
    const sortOrder = document.getElementById('reportSortOrder') ? .value || 'highest';

    let csv = 'Faculty Ratings Report\n';
    csv += `Department Filter: ${deptFilter}\n`;
    csv += `Sort Order: ${sortOrder}\n\n`;
    csv += 'Department,Rank,Faculty Name,1st Year,2nd Year,3rd Year,Overall Average,Total Responses\n';

    currentReportData.forEach(row => {
        csv += `"${row.department}",${row.rank},"${row.name}",${row.year1},${row.year2},${row.year3},${row.overall},${row.total}\n`;
    });

    const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `faculty_ratings_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('CSV exported successfully!', 'success');
}

function exportReportPDF() {
    if (!currentReportData || currentReportData.length === 0) {
        showAlert('No report data to export. Generate a report first.', 'warning');
        return;
    }

    const deptFilter = document.getElementById('reportDepartmentFilter') ? .value || 'All Departments';
    const sortOrder = document.getElementById('reportSortOrder') ? .value || 'highest';

    // Create a printable HTML version
    const printWindow = window.open('', '', 'height=800,width=1000');

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Faculty Ratings Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
                .info { margin: 20px 0; padding: 15px; background: #f8f9ff; border-left: 4px solid #7c3aed; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #7c3aed; color: white; padding: 12px; text-align: left; font-weight: bold; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f8f9ff; }
                .rank { font-weight: bold; color: #7c3aed; text-align: center; }
                .rating { text-align: center; font-weight: bold; }
                .high { color: #059669; }
                .medium { color: #d97706; }
                .low { color: #dc2626; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>📊 Faculty Ratings Report</h1>
            <div class="info">
                <strong>Department Filter:</strong> ${deptFilter}<br>
                <strong>Sort Order:</strong> ${sortOrder === 'highest' ? 'Highest Rating First' : sortOrder === 'lowest' ? 'Lowest Rating First' : 'Faculty Name (A-Z)'}<br>
                <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
                <strong>Total Faculty:</strong> ${currentReportData.length}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Department</th>
                        <th style="text-align: center;">Rank</th>
                        <th>Faculty Name</th>
                        <th style="text-align: center;">1st Year</th>
                        <th style="text-align: center;">2nd Year</th>
                        <th style="text-align: center;">3rd Year</th>
                        <th style="text-align: center;">Overall</th>
                        <th style="text-align: center;">Responses</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentReportData.forEach(row => {
        const getRatingClass = (rating) => {
            if (rating === '-') return '';
            const val = parseFloat(rating);
            if (val >= 7) return 'high';
            if (val >= 5) return 'medium';
            return 'low';
        };

        html += `
            <tr>
                <td>${row.department}</td>
                <td class="rank">${row.rank}</td>
                <td>${row.name}</td>
                <td class="rating ${getRatingClass(row.year1)}">${row.year1}</td>
                <td class="rating ${getRatingClass(row.year2)}">${row.year2}</td>
                <td class="rating ${getRatingClass(row.year3)}">${row.year3}</td>
                <td class="rating ${getRatingClass(row.overall)}">${row.overall}</td>
                <td style="text-align: center;">${row.total}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">🖨️ Print / Save as PDF</button>
                <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; margin-left: 10px;">✕ Close</button>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    showAlert('PDF preview opened. Use Print to save as PDF.', 'success');
}