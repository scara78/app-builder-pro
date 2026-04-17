import fs from 'fs';
import path from 'path';

async function fetchModels() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const keyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
  const apiKey = keyMatch ? keyMatch[1].trim() : '';

  if (!apiKey) {
    console.error('No API Key found in .env');
    process.exit(1);
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  
  if (data.models) {
    const geminiModels = data.models
      .map(m => m.name.replace('models/', ''))
      .filter(n => n.includes('gemini'));
    console.log('Available Gemini Models:', JSON.stringify(geminiModels, null, 2));
  } else {
    console.error('Error Response from Google:', JSON.stringify(data, null, 2));
  }
}

fetchModels();
