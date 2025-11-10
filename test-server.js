// Quick test to verify the server is working
const testData = {
  papers: [{ id: 'test', title: 'Test Paper', status: 'to_read', dependencies: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
  topics: [],
  navigation: { currentTopicId: null, expandedTopicIds: [] }
};

fetch('http://localhost:3001/api/papers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
  .then(res => res.json())
  .then(data => console.log('✅ Server is working!', data))
  .catch(err => console.error('❌ Server is NOT running or not accessible:', err.message));
