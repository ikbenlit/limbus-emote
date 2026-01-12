import Stats from 'stats.js';
import { CONFIG } from '../config.js';

export const initPerfMonitor = () => {
  if (!CONFIG.debug?.enabled || !CONFIG.debug?.showFPS) {
    return null;
  }

  const stats = new Stats();
  stats.showPanel(0);
  stats.dom.classList.add('stats-panel');
  document.body.appendChild(stats.dom);

  return {
    begin: () => stats.begin(),
    end: () => stats.end(),
    destroy: () => {
      if (stats.dom?.parentNode) {
        stats.dom.parentNode.removeChild(stats.dom);
      }
    }
  };
};
