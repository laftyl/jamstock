const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { requireAuth } = require('../auth');
const { classifyParticipant, normalizeEmail } = require('../parse');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function createImportRouter(authService, participantRepository) {
  const router = express.Router();
  router.use(requireAuth(authService));

  router.post('/preview', upload.single('file'), (request, response) => {
    if (!request.file) {
      return response.status(400).json({ error: 'Choose a CSV or Excel file.' });
    }

    const rows = parseSpreadsheet(request.file.buffer, request.file.originalname).map(classifyParticipant);
    const emails = new Set();
    let duplicates = 0;

    for (const row of rows) {
      const email = normalizeEmail(row.email);
      if (email && emails.has(email)) {
        row.status = 'duplicate';
        duplicates += 1;
      } else if (email) {
        emails.add(email);
      }
    }

    response.json({
      rows,
      valid: rows.filter((row) => row.status === 'eligible').length,
      excluded: rows.filter((row) => row.status === 'excluded').length,
      invalid: rows.filter((row) => row.status !== 'eligible').length,
      duplicates,
    });
  });

  router.post('/commit', (request, response) => {
    if (!Array.isArray(request.body)) {
      return response.status(400).json({ error: 'The import preview is invalid. Preview the file again.' });
    }

    const result = participantRepository.saveParticipants(request.body);
    response.json({ ok: true, ...result });
  });

  return router;
}

function parseSpreadsheet(buffer, filename) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
    .map((row) => ({ ...row, source_file: filename }));
}

module.exports = { createImportRouter, parseSpreadsheet };