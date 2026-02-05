// Faculty Ratings Report with Filtering and Sorting
// This is the improved version - copy this function to visualization.js

async function displayFacultyRatingsByYear() {
    const allFeedbacks = await Storage.getFeedbacks();
    const container = document.getElementById('facultyRatingsContainer');

    // Get filter values
    const deptFilter = document.getElementById('reportDepartmentFilter') ? .value || '';
    const yearFilter = document.getElementById('reportYearFilter') ? .value || '';
    const sortOrder = document.getElementById('reportSortOrder') ? .value || 'highest';

    if (allFeedbacks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 249, 255, 0.3) 100%); border-radius: 12px; border: 2px dashed #e0e0e0;">
                <span style="font-size: 64px; display: block; margin-bottom: 20px;">📭</span>
                <h3 style="color: #1a202c; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">No Data Available</h3>
                <p style="color: #718096; margin: 0; font-size: 14px;">No feedback data available. Students need to submit surveys to generate reports.</p>
            </div>
        `;
        return;
    }

    // Filter feedbacks based on selected filters
    let filteredFeedbacks = allFeedbacks;

    if (deptFilter) {
        filteredFeedbacks = filteredFeedbacks.filter(f =>
            (f.studentDepartment || f.department) === deptFilter
        );
    }

    if (yearFilter) {
        filteredFeedbacks = filteredFeedbacks.filter(f =>
            String(f.studentYear) === yearFilter
        );
    }

    console.log(`📊 Report - Dept: ${deptFilter || 'All'}, Year: ${yearFilter || 'All'}, Sort: ${sortOrder}`);
    console.log(`📊 Filtered: ${filteredFeedbacks.length} of ${allFeedbacks.length} feedbacks`);

    // Organize data by department, then faculty and year
    const departmentData = {};

    filteredFeedbacks.forEach(feedback => {
        if (feedback.responses && Array.isArray(feedback.responses)) {
            feedback.responses.forEach(response => {
                const facultyId = response.teacherId || 'unknown';
                const facultyName = response.teacherName || 'Unknown Faculty';
                const year = String(feedback.studentYear || '1');
                const department = feedback.studentDepartment || feedback.department || 'Unknown';
                const rating = parseFloat(response.rating);

                if (isNaN(rating) || rating < 1 || rating > 10) return;

                if (!departmentData[department]) departmentData[department] = {};

                if (!departmentData[department][facultyId]) {
                    departmentData[department][facultyId] = {
                        name: facultyName,
                        id: facultyId,
                        '1': {
                            ratings: [],
                            count: 0
                        },
                        '2': {
                            ratings: [],
                            count: 0
                        },
                        '3': {
                            ratings: [],
                            count: 0
                        },
                        combined: {
                            ratings: [],
                            count: 0
                        }
                    };
                }

                if (departmentData[department][facultyId][year]) {
                    departmentData[department][facultyId][year].ratings.push(rating);
                    departmentData[department][facultyId][year].count++;
                    departmentData[department][facultyId].combined.ratings.push(rating);
                    departmentData[department][facultyId].combined.count++;
                }
            });
        }
    });

    container.innerHTML = '';

    if (Object.keys(departmentData).length === 0) {
        const filterMsg = deptFilter ? ` for ${deptFilter}` : '';
        const yearMsg = yearFilter ? ` (${yearFilter === '1' ? '1st' : yearFilter === '2' ? '2nd' : '3rd'} Year)` : '';
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 249, 255, 0.3) 100%); border-radius: 12px; border: 2px dashed #e0e0e0;">
                <span style="font-size: 64px; display: block; margin-bottom: 20px;">📭</span>
                <h3 style="color: #1a202c; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">No Faculty Data</h3>
                <p style="color: #718096; margin: 0; font-size: 14px;">No faculty ratings available${filterMsg}${yearMsg}.</p>
                <p style="color: #7c3aed; margin: 10px 0 0 0; font-size: 13px;">Try changing the filters above.</p>
            </div>
        `;
        return;
    }

    // Create sections for each department
    Object.keys(departmentData).sort().forEach((department, deptIndex) => {
        const facultyInDept = departmentData[department];

        // Convert to array and sort
        let facultyArray = Object.values(facultyInDept);

        if (sortOrder === 'highest') {
            facultyArray.sort((a, b) => {
                const avgA = a.combined.count > 0 ? a.combined.ratings.reduce((s, r) => s + r, 0) / a.combined.count : 0;
                const avgB = b.combined.count > 0 ? b.combined.ratings.reduce((s, r) => s + r, 0) / b.combined.count : 0;
                return avgB - avgA;
            });
        } else if (sortOrder === 'lowest') {
            facultyArray.sort((a, b) => {
                const avgA = a.combined.count > 0 ? a.combined.ratings.reduce((s, r) => s + r, 0) / a.combined.count : 0;
                const avgB = b.combined.count > 0 ? b.combined.ratings.reduce((s, r) => s + r, 0) / b.combined.count : 0;
                return avgA - avgB;
            });
        } else {
            facultyArray.sort((a, b) => a.name.localeCompare(b.name));
        }

        const totalFaculty = facultyArray.length;
        const avgDeptRating = facultyArray.reduce((sum, f) => {
            if (f.combined.count > 0) {
                return sum + (f.combined.ratings.reduce((s, r) => s + r, 0) / f.combined.count);
            }
            return sum;
        }, 0) / totalFaculty;

        // Department header
        const deptHeader = document.createElement('div');
        deptHeader.style.cssText = `margin-top: ${deptIndex === 0 ? '0' : '40px'}; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);`;
        deptHeader.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">📚</span>${department} Department
                    </h3>
                    <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">${totalFaculty} ${totalFaculty === 1 ? 'Faculty' : 'Faculties'} • Dept Avg: ${avgDeptRating.toFixed(2)}/10</p>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700;">${avgDeptRating.toFixed(1)}</div>
                    <div style="font-size: 11px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Avg Rating</div>
                </div>
            </div>
        `;
        container.appendChild(deptHeader);

        // Table
        const table = document.createElement('div');
        table.style.cssText = 'overflow-x: auto; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);';

        let html = `<table style="width: 100%; border-collapse: collapse; background: white;"><thead><tr style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%); border-bottom: 2px solid #7c3aed;">
            <th style="padding: 16px 20px; text-align: left; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Rank</th>
            <th style="padding: 16px 20px; text-align: left; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Faculty Name</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">1st Year</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">2nd Year</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">3rd Year</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Overall</th>
            <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #1a202c; font-size: 14px; text-transform: uppercase;">Total</th>
        </tr></thead><tbody>`;

        facultyArray.forEach((faculty, index) => {
            const y1 = faculty['1'].count > 0 ? (faculty['1'].ratings.reduce((a, b) => a + b, 0) / faculty['1'].count).toFixed(2) : '-';
            const y2 = faculty['2'].count > 0 ? (faculty['2'].ratings.reduce((a, b) => a + b, 0) / faculty['2'].count).toFixed(2) : '-';
            const y3 = faculty['3'].count > 0 ? (faculty['3'].ratings.reduce((a, b) => a + b, 0) / faculty['3'].count).toFixed(2) : '-';
            const avg = faculty.combined.count > 0 ? (faculty.combined.ratings.reduce((a, b) => a + b, 0) / faculty.combined.count).toFixed(2) : '-';

            const bg = index % 2 === 0 ? '#ffffff' : '#f8f9ff';
            const rank = sortOrder === 'highest' && index < 3 && avg !== '-' ? ['🥇', '🥈', '🥉'][index] : (sortOrder !== 'name' ? index + 1 : '-');

            const getColor = (r) => r === '-' ? '#999' : parseFloat(r) >= 7 ? '#059669' : parseFloat(r) >= 5 ? '#d97706' : '#dc2626';
            const getBg = (r) => r === '-' ? 'rgba(200,200,200,0.1)' : parseFloat(r) >= 7 ? 'rgba(5,150,105,0.1)' : parseFloat(r) >= 5 ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)';

            html += `<tr style="background: ${bg}; border-bottom: 1px solid #e8e8e8;" onmouseover="this.style.background='rgba(124,58,237,0.05)';" onmouseout="this.style.background='${bg}';">
                <td style="padding: 16px 20px; text-align: center; font-weight: 700; color: #7c3aed; font-size: 16px;">${rank}</td>
                <td style="padding: 16px 20px; font-weight: 600; color: #1a202c;">👨‍🏫 ${faculty.name}</td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: ${getBg(y1)}; color: ${getColor(y1)}; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; min-width: 60px; display: inline-block;">${y1 === '-' ? '-' : y1 + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: ${getBg(y2)}; color: ${getColor(y2)}; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; min-width: 60px; display: inline-block;">${y2 === '-' ? '-' : y2 + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: ${getBg(y3)}; color: ${getColor(y3)}; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; min-width: 60px; display: inline-block;">${y3 === '-' ? '-' : y3 + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.1) 100%); color: #7c3aed; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 15px; min-width: 70px; border: 2px solid #7c3aed; display: inline-block;">${avg === '-' ? '-' : avg + '/10'}</span></td>
                <td style="padding: 16px 12px; text-align: center; font-weight: 600; color: #666;">${faculty.combined.count}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        table.innerHTML = html;
        container.appendChild(table);
    });

    const filters = [];
    if (deptFilter) filters.push(`Dept: ${deptFilter}`);
    if (yearFilter) filters.push(`Year: ${yearFilter === '1' ? '1st' : yearFilter === '2' ? '2nd' : '3rd'}`);
    const filterText = filters.length > 0 ? ` (${filters.join(', ')})` : '';

    showAlert(`Report generated!${filterText}`, 'success');
}