// API endpoint to save papers data
// For Azure Static Web Apps, this will be deployed as a serverless function

const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
  context.log('Papers API called');

  // CORS headers
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  };

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  // GET - Read papers.json
  if (req.method === 'GET') {
    try {
      const filePath = path.join(__dirname, '../public/papers.json');
      const data = fs.readFileSync(filePath, 'utf8');
      context.res.status = 200;
      context.res.body = JSON.parse(data);
    } catch (error) {
      context.res.status = 500;
      context.res.body = { error: 'Failed to read papers.json' };
    }
    return;
  }

  // POST/PUT - Write to papers.json
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const filePath = path.join(__dirname, '../public/papers.json');
      const data = JSON.stringify(req.body, null, 2);
      fs.writeFileSync(filePath, data, 'utf8');
      context.res.status = 200;
      context.res.body = { success: true, message: 'Papers saved successfully' };
    } catch (error) {
      context.res.status = 500;
      context.res.body = { error: 'Failed to write papers.json' };
    }
    return;
  }

  // Method not allowed
  context.res.status = 405;
  context.res.body = { error: 'Method not allowed' };
};
