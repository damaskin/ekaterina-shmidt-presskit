import { LazyMotion } from 'framer-motion';
import { createRoot } from 'react-dom/client';
import App from './App';
import { domAnimation } from './motion';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <LazyMotion features={domAnimation} strict>
    <App />
  </LazyMotion>,
);
