
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Make sure the root element exists before trying to render
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
}
