const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // Parse JSON bodies

app.get('/api/test', (req, res) => {
    res.send({ message: 'Backend is working!' });
});

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
