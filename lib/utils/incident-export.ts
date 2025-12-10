/**
 * Incident Export Utilities
 * Provides print and download functionality for incident reports
 */

import type { OVRReportWithRelations } from '@/lib/types';
import { getStatusLabel } from './status';
import { format } from 'date-fns';

/**
 * Generate printable HTML for incident report
 * Excludes navigation, sidebar, headers
 */
export function generatePrintableHTML(incident: OVRReportWithRelations): string {
    const reporterName = incident.reporter
        ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
        : 'Unknown';

    const locationName = incident.location?.name || 'Unknown';
    const locationDetails = [incident.location?.building, incident.location?.floor]
        .filter(Boolean)
        .join(' • ');

    const supervisorName = incident.supervisor
        ? `${incident.supervisor.firstName} ${incident.supervisor.lastName}`
        : 'Not assigned';

    const involvedPersonDetails = incident.involvedPersonName
        ? `${incident.involvedPersonName}${incident.involvedPersonMRN ? ` (MRN: ${incident.involvedPersonMRN})` : ''}`
        : 'Not specified';

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Incident Report - ${incident.id}</title>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #1a1a1a;
      font-size: 14px;
      line-height: 1.6;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 12px;
      margin-bottom: 24px;
      font-size: 24px;
    }
    h2 {
      color: #333;
      font-size: 16px;
      margin: 24px 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .header-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .header-item {
      text-align: center;
    }
    .header-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .header-value {
      font-weight: 600;
      color: #1a1a1a;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      background: #e3f2fd;
      color: #1565c0;
    }
    .section {
      margin: 20px 0;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #eee;
    }
    .section-title {
      font-weight: 600;
      color: #444;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .field {
      margin-bottom: 12px;
    }
    .label {
      font-weight: 600;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .value {
      color: #1a1a1a;
    }
    .description {
      white-space: pre-wrap;
      background: #fff;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Incident Report: ${incident.id}</h1>
  
  <div class="header-info">
    <div class="header-item">
      <div class="header-label">Status</div>
      <div class="status-badge">${getStatusLabel(incident.status)}</div>
    </div>
    <div class="header-item">
      <div class="header-label">Occurrence Date</div>
      <div class="header-value">${format(new Date(incident.occurrenceDate), 'MMM dd, yyyy')}</div>
    </div>
    <div class="header-item">
      <div class="header-label">Occurrence Time</div>
      <div class="header-value">${incident.occurrenceTime || 'Not specified'}</div>
    </div>
    <div class="header-item">
      <div class="header-label">Submitted</div>
      <div class="header-value">${incident.submittedAt ? format(new Date(incident.submittedAt), 'MMM dd, yyyy') : 'Draft'}</div>
    </div>
  </div>

  <h2>Reporter Information</h2>
  <div class="section">
    <div class="field">
      <div class="label">Reporter</div>
      <div class="value">${reporterName}</div>
    </div>
    <div class="field">
      <div class="label">Email</div>
      <div class="value">${incident.reporter?.email || 'Not available'}</div>
    </div>
    <div class="field">
      <div class="label">Department</div>
      <div class="value">${incident.reporter?.department || 'Not specified'}</div>
    </div>
  </div>

  <h2>Location</h2>
  <div class="section">
    <div class="field">
      <div class="label">Location</div>
      <div class="value">${locationName}</div>
    </div>
    ${locationDetails ? `
    <div class="field">
      <div class="label">Details</div>
      <div class="value">${locationDetails}</div>
    </div>
    ` : ''}
  </div>

  <h2>Person Involved</h2>
  <div class="section">
    <div class="field">
      <div class="label">Type</div>
      <div class="value" style="text-transform: capitalize;">${incident.personInvolved || 'Not specified'}</div>
    </div>
    <div class="field">
      <div class="label">Name / MRN</div>
      <div class="value">${involvedPersonDetails}</div>
    </div>
  </div>

  <h2>Occurrence Details</h2>
  <div class="section">
    <div class="field">
      <div class="label">Category</div>
      <div class="value" style="text-transform: capitalize;">${(incident.occurrenceCategory || '').replace(/_/g, ' ')}</div>
    </div>
    <div class="field">
      <div class="label">Subcategory</div>
      <div class="value" style="text-transform: capitalize;">${(incident.occurrenceSubcategory || '').replace(/_/g, ' ')}</div>
    </div>
    <div class="field">
      <div class="label">Level of Harm</div>
      <div class="value" style="text-transform: capitalize;">${(incident.levelOfHarm || '').replace(/_/g, ' ')}</div>
    </div>
    <div class="field">
      <div class="label">Description</div>
      <div class="description">${incident.description || 'No description provided'}</div>
    </div>
  </div>

  ${incident.physicianSawPatient ? `
  <h2>Medical Assessment</h2>
  <div class="section">
    <div class="field">
      <div class="label">Physician</div>
      <div class="value">${incident.physicianName || 'Unknown'} ${incident.physicianId ? `(ID: ${incident.physicianId})` : ''}</div>
    </div>
    ${incident.treatmentTypes && incident.treatmentTypes.length > 0 ? `
    <div class="field">
      <div class="label">Treatment Types</div>
      <div class="value">${(incident.treatmentTypes as string[]).map(t => t.replace(/_/g, ' ')).join(', ')}</div>
    </div>
    ` : ''}
    ${incident.treatmentProvided ? `
    <div class="field">
      <div class="label">Treatment Provided</div>
      <div class="description">${incident.treatmentProvided}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${incident.supervisorId ? `
  <h2>Supervisor Review</h2>
  <div class="section">
    <div class="field">
      <div class="label">Supervisor</div>
      <div class="value">${supervisorName}</div>
    </div>
    ${incident.supervisorAction ? `
    <div class="field">
      <div class="label">Action Taken</div>
      <div class="description">${incident.supervisorAction}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${incident.riskScore ? `
  <h2>Risk Classification</h2>
  <div class="section">
    <div class="field">
      <div class="label">Risk Score</div>
      <div class="value">${incident.riskScore}</div>
    </div>
    ${incident.riskImpact ? `
    <div class="field">
      <div class="label">Impact</div>
      <div class="value">${incident.riskImpact}/5</div>
    </div>
    ` : ''}
    ${incident.riskLikelihood ? `
    <div class="field">
      <div class="label">Likelihood</div>
      <div class="value">${incident.riskLikelihood}/5</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${incident.investigation ? `
  <h2>Investigation</h2>
  <div class="section">
    ${incident.investigation.findings ? `
    <div class="field">
      <div class="label">Findings</div>
      <div class="description">${incident.investigation.findings}</div>
    </div>
    ` : ''}
    ${incident.investigation.problemsIdentified ? `
    <div class="field">
      <div class="label">Problems Identified</div>
      <div class="description">${incident.investigation.problemsIdentified}</div>
    </div>
    ` : ''}
    ${incident.investigation.causeClassification ? `
    <div class="field">
      <div class="label">Cause Classification</div>
      <div class="value">${incident.investigation.causeClassification}</div>
    </div>
    ` : ''}
    ${incident.investigation.causeDetails ? `
    <div class="field">
      <div class="label">Cause Details</div>
      <div class="description">${incident.investigation.causeDetails}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${incident.correctiveActions && incident.correctiveActions.length > 0 ? `
  <h2>Corrective Actions</h2>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Status</th>
        <th>Due Date</th>
      </tr>
    </thead>
    <tbody>
      ${incident.correctiveActions.map(action => `
      <tr>
        <td>${action.title}</td>
        <td style="text-transform: capitalize;">${(action.status || '').replace(/_/g, ' ')}</td>
        <td>${action.dueDate ? format(new Date(action.dueDate), 'MMM dd, yyyy') : 'Not set'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${incident.caseReview ? `
  <h2>Case Review</h2>
  <div class="section">
    <div class="description">${incident.caseReview}</div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated on ${format(new Date(), 'MMMM dd, yyyy \'at\' h:mm a')}</p>
    <p>This is an official incident report document.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Trigger browser print dialog
 */
export function printIncident(incident: OVRReportWithRelations): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(generatePrintableHTML(incident));
        printWindow.document.close();
        // Small delay to ensure content is loaded before print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
}

/**
 * Download incident as HTML file
 */
export function downloadIncident(incident: OVRReportWithRelations): void {
    const html = generatePrintableHTML(incident);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${incident.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
