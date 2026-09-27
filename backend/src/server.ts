import { createApp } from './app.js';
import { environment } from './config/environment.js';

const app = createApp();

app.listen(environment.PORT, () => {
  console.log(`Backend listening on http://localhost:${environment.PORT}`);
});
