// Silenciar todos los warnings de Node.js (experimental, modules, etc)
process.removeAllListeners('warning');
process.on('warning', () => {});

import fs from 'fs';
import path from 'path';

// Utilidad para recorrer directorios recursivamente y filtrar archivos
function walk(dir: string, filter: (file: string) => boolean, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, filter, fileList);
    } else if (filter(fullPath)) {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

// 1. Encontrar todos los endpoints API (carpetas con route.ts)
function getApiEndpoints(apiBase: string): { endpoint: string; routeFile: string }[] {
  const endpoints: { endpoint: string; routeFile: string }[] = [];
  function search(dir: string, relPath: string = '') {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const rel = path.join(relPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        search(fullPath, rel);
      } else if (file === 'route.ts') {
        // endpoint: /api/<relPath sin /route.ts>
        const endpoint =
          '/api/' +
          rel
            .replace(/\\|\//g, '/')
            .replace(/\/route\.ts$/, '')
            .replace(/\/route\.ts$/, '')
            .replace(/route\.ts$/, '')
            .replace(/\/$/, '');
        endpoints.push({ endpoint, routeFile: fullPath });
      }
    });
  }
  search(apiBase);
  return endpoints;
}

// 2. Buscar referencias a cada endpoint en /app, /components, /services, /lib (excepto /app/api)
function findEndpointUsages(
  searchBases: string[],
  endpoint: string
): { file: string; count: number; type: 'exact' | 'loose' }[] {
  const result: { file: string; count: number; type: 'exact' | 'loose' }[] = [];
  let files: string[] = [];
  searchBases.forEach(base => {
    if (fs.existsSync(base)) {
      files = files.concat(
        walk(
          base,
          f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
        )
      );
    }
  });
  // Detectar si el endpoint tiene [param]
  // Detectar si el endpoint tiene uno o varios [param]
  const paramRegex = /\[([\w]+)\]/g;
  const templatePatterns: RegExp[] = [];
  let match;
  const paramNames: string[] = [];
  while ((match = paramRegex.exec(endpoint)) !== null) {
    paramNames.push(match[1]);
  }
  if (paramNames.length > 0) {
    // Construir patrones para todas las combinaciones de parámetros
    // Ejemplo: /api/docente/clases/[classId]/asistencia => /api/docente/clases/${classId}/asistencia, /api/docente/clases/{classId}/asistencia, /api/docente/clases/${var}/asistencia, etc.
    // 1. Coincidencia exacta con todos los nombres de parámetro
    let patternExact = endpoint;
    paramNames.forEach(name => {
      patternExact = patternExact.replace(`[${name}]`, `\\$\\{${name}\\}`);
    });
    templatePatterns.push(new RegExp(patternExact));
    // 2. Coincidencia genérica con cualquier variable JS
    let patternGeneric = endpoint;
    paramNames.forEach(() => {
      patternGeneric = patternGeneric.replace(/\[\w+\]/, `\\$\\{[^}]+\\}`);
    });
    templatePatterns.push(new RegExp(patternGeneric));
    // 3. Coincidencia exacta con llaves solas {param}
    let patternCurlyExact = endpoint;
    paramNames.forEach(name => {
      patternCurlyExact = patternCurlyExact.replace(`[${name}]`, `{${name}}`);
    });
    templatePatterns.push(new RegExp(patternCurlyExact));
    // 4. Coincidencia genérica con llaves solas {variable}
    let patternCurlyGeneric = endpoint;
    paramNames.forEach(() => {
      patternCurlyGeneric = patternCurlyGeneric.replace(/\[\w+\]/, `{[^}]+}`);
    });
    templatePatterns.push(new RegExp(patternCurlyGeneric));
  }
  files.forEach(file => {
    // Evitar buscar dentro de /app/api/
    if (file.includes(path.join('app', 'api'))) return;
    const content = fs.readFileSync(file, 'utf8');
    // 1. Coincidencia exacta (endpoint entre comillas)
    const regex = new RegExp(`['"]${endpoint}['"]`, 'g');
    const exactMatches = content.match(regex);
    if (exactMatches && exactMatches.length > 0) {
      result.push({ file, count: exactMatches.length, type: 'exact' });
    }
    // 2. Coincidencia laxa: endpoint como substring + fetch/axios/metodo HTTP
    const httpWords = ['fetch', 'axios', 'GET', 'POST', 'PUT', 'DELETE'];
    const foundEndpoint = content.includes(endpoint);
    const foundHttpWord = httpWords.some(word => content.includes(word));
    if (foundEndpoint && foundHttpWord && !(exactMatches && exactMatches.length > 0)) {
      // Solo agregar si no fue ya agregado como exact
      // Contar cuántas veces aparece el endpoint
      const looseCount = content.split(endpoint).length - 1;
      result.push({ file, count: looseCount, type: 'loose' });
    }
    // 3. Coincidencia laxa: template string para endpoints con [param] (todas las variantes)
    if (templatePatterns && templatePatterns.length > 0) {
      templatePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          result.push({ file, count: matches.length, type: 'loose' });
        }
      });
    }
  });
  return result;
}

// 3. Main
// Solución compatible con ES modules para obtener el directorio actual
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const apiBase = path.join(__dirname, '../app/api');
const searchBases = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components'),
  path.join(__dirname, '../services'),
  path.join(__dirname, '../lib'),
];

const endpoints = getApiEndpoints(apiBase);

const report: {
  endpoint: string;
  routeFile: string;
  usages: { file: string; count: number; type: 'exact' | 'loose' }[];
}[] = [];

endpoints.forEach(({ endpoint, routeFile }) => {
  const usages = findEndpointUsages(searchBases, endpoint);
  report.push({ endpoint, routeFile, usages });
});

// 4. Resumen final
const unused = report.filter(
  r => r.usages.length === 0 && r.endpoint !== '/api/auth/[...nextauth]'
);

const used = report.filter(r => r.usages.length > 0);
