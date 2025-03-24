// src/server.ts
import config from './config';
import { connectKafka } from './config/kafka';
import app from './app';


const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectKafka(config.kafkaProducer);

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
  }
})();
