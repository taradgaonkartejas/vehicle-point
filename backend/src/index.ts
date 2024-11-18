import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

// Middleware to handle CORS if necessary
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Sample API route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
