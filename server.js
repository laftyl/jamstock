const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const { openDatabase } = require('./src/db');
const { createAuthService } = require('./src/auth');
const { createRepositories } = require('./src/repositories');
const { createAuthRouter } = require('./src/routes/auth');
const { createBandsRouter } = require('./src/routes/bands');
const { createImportRouter } = require('./src/routes/import');
const { createParticipantsRouter } = require('./src/routes/participants');
const { createWorkspaceRouter } = require('./src/routes/workspace');

const root = __dirname;
const dataDir = path.join(root, 'data');
const db = openDatabase(path.join(dataDir, 'jamstock.db'));
const repositories = createRepositories(db);
repositories.instruments.ensureDefaults();
const authService = createAuthService(repositories.settings, repositories.sessions);
const app = express();
const port = 3000;

fs.mkdirSync(dataDir, { recursive: true });
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(root, 'public'), { setHeaders: (response) => response.setHeader('Cache-Control', 'no-store') }));
app.use('/api/auth', createAuthRouter(authService));
app.use('/api', createParticipantsRouter(authService, repositories));
app.use('/api/import', createImportRouter(authService, repositories.participants));
app.use('/api/bands', createBandsRouter(authService, repositories));
app.use('/api', createWorkspaceRouter(authService, repositories.workspace));
app.use('/api', (request, response) => response.status(404).json({ error: `API route not found: ${request.method} ${request.path}` }));

app.listen(port, '127.0.0.1', () => console.log(`RVA JamStock running at http://localhost:${port}`));
