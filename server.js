const server = require('./backend/server');

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`\nSolvox berjalan di port ${port}`);
    console.log(`Local : http://localhost:${port}`);
    console.log('Question engine: local deterministic generator');
  });
}

module.exports = server;
