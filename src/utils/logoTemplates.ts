/**
 * Professional Pet Shop Logo Templates (SVG Generators)
 */

export interface LogoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'luxo' | 'tosa' | 'fofo' | 'clinica';
}

export const LOGO_TEMPLATES: LogoTemplate[] = [
  {
    id: 'paw-gold',
    name: 'Patinha de Ouro Premium',
    description: 'Selo circular sofisticado com patinha dourada e estrelas',
    category: 'luxo'
  },
  {
    id: 'royal-grooming',
    name: 'Tosa Realeza & Coroa',
    description: 'Design de tesoura cruzada com coroa de realeza e patinha',
    category: 'tosa'
  },
  {
    id: 'happy-pup',
    name: 'Puppy Minimalista',
    description: 'Desenho moderno de cachorro feliz com orelhas caídas',
    category: 'fofo'
  },
  {
    id: 'cozy-cat',
    name: 'Gatinho Aconchego',
    description: 'Silhueta elegante de gato aninhado em formato de coração',
    category: 'fofo'
  },
  {
    id: 'bubble-bath',
    name: 'Banho de Espuma',
    description: 'Banheira retrô cheia de bolhas e patinha feliz',
    category: 'luxo'
  },
  {
    id: 'heart-care',
    name: 'Coração Pet Care',
    description: 'Coração protetor integrando cão e gato em harmonia',
    category: 'clinica'
  }
];

export function getSvgString(templateId: string, colorClass: string): string {
  // Extract gradient colors based on gradient classes
  let col1 = '#0ea5e9'; // sky-500
  let col2 = '#4f46e5'; // indigo-600

  if (colorClass.includes('rose') && colorClass.includes('orange')) {
    col1 = '#f43f5e'; col2 = '#f97316';
  } else if (colorClass.includes('emerald') && colorClass.includes('teal')) {
    col1 = '#10b981'; col2 = '#0d9488';
  } else if (colorClass.includes('amber') && colorClass.includes('red')) {
    col1 = '#f59e0b'; col2 = '#dc2626';
  } else if (colorClass.includes('fuchsia') && colorClass.includes('purple')) {
    col1 = '#d946ef'; col2 = '#9333ea';
  }

  const gradientDef = `
    <defs>
      <linearGradient id="template-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${col1}" />
        <stop offset="100%" stop-color="${col2}" />
      </linearGradient>
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
    </defs>
  `;

  switch (templateId) {
    case 'paw-gold':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          ${gradientDef}
          <circle cx="50" cy="50" r="46" fill="url(#template-grad)" />
          <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="3,3" opacity="0.8" />
          <circle cx="50" cy="50" r="36" fill="#ffffff" />
          
          <!-- Paw Print (Gold) -->
          <g fill="url(#gold-grad)">
            <!-- Central pad -->
            <path d="M50,44 C42,44 40,54 44,60 C47,64 53,64 56,60 C60,54 58,44 50,44 Z" />
            <!-- Toe 1 -->
            <ellipse cx="36" cy="45" rx="5" ry="7" transform="rotate(-15 36 45)" />
            <!-- Toe 2 -->
            <ellipse cx="45" cy="36" rx="5.5" ry="8" />
            <!-- Toe 3 -->
            <ellipse cx="55" cy="36" rx="5.5" ry="8" />
            <!-- Toe 4 -->
            <ellipse cx="64" cy="45" rx="5" ry="7" transform="rotate(15 64 45)" />
          </g>

          <!-- Stars -->
          <path d="M50,20 L51.5,23.5 L55,24 L52.5,26.5 L53,30 L50,28 L47,30 L47.5,26.5 L45,24 L48.5,23.5 Z" fill="url(#gold-grad)" />
          <path d="M26,35 L27,37 L29,37 L27.5,38 L28,40 L26,39 L24,40 L24.5,38 L23,37 L25,37 Z" fill="url(#gold-grad)" transform="scale(0.8) translate(10, 10)" />
          <path d="M74,35 L75,37 L77,37 L75.5,38 L76,40 L74,39 L72,40 L72.5,38 L71,37 L73,37 Z" fill="url(#gold-grad)" transform="scale(0.8) translate(18, 10)" />
        </svg>
      `;

    case 'royal-grooming':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          ${gradientDef}
          <rect width="100" height="100" rx="24" fill="url(#template-grad)" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.5" />
          
          <!-- Crown -->
          <path d="M38,32 L42,38 L50,30 L58,38 L62,32 L60,42 L40,42 Z" fill="#ffffff" />
          <circle cx="38" cy="31" r="1.5" fill="#ffffff" />
          <circle cx="50" cy="29" r="1.5" fill="#ffffff" />
          <circle cx="62" cy="31" r="1.5" fill="#ffffff" />

          <!-- Scissors -->
          <g stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.95">
            <!-- Blade 1 -->
            <line x1="32" y1="68" x2="50" y2="50" />
            <!-- Blade 2 -->
            <line x1="68" y1="68" x2="50" y2="50" />
            <!-- Handle 1 -->
            <circle cx="28" cy="72" r="5" stroke-width="3" />
            <!-- Handle 2 -->
            <circle cx="72" cy="72" r="5" stroke-width="3" />
          </g>

          <!-- Little Paw print in center -->
          <g fill="#ffffff">
            <circle cx="50" cy="54" r="5" />
            <circle cx="43" cy="48" r="2.2" />
            <circle cx="48" cy="45" r="2.5" />
            <circle cx="53" cy="45" r="2.5" />
            <circle cx="58" cy="48" r="2.2" />
          </g>
        </svg>
      `;

    case 'happy-pup':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          ${gradientDef}
          <circle cx="50" cy="50" r="48" fill="url(#template-grad)" />
          <circle cx="50" cy="50" r="44" fill="#ffffff" />
          
          <!-- Dog face drawing -->
          <g stroke="url(#template-grad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <!-- Left Ear -->
            <path d="M28,38 C22,38 18,50 21,58 C23,62 28,62 28,52 Z" fill="url(#template-grad)" fill-opacity="0.15" />
            <!-- Right Ear -->
            <path d="M72,38 C78,38 82,50 79,58 C77,62 72,62 72,52 Z" fill="url(#template-grad)" fill-opacity="0.15" />
            <!-- Head outline -->
            <path d="M32,38 C35,32 65,32 68,38 C70,45 70,55 65,62 C58,70 42,70 35,62 C30,55 30,45 32,38 Z" />
            <!-- Nose and mouth -->
            <path d="M46,54 L54,54 C54,57 52,59 50,59 C48,59 46,57 46,54 Z" fill="url(#template-grad)" />
            <path d="M50,59 L50,64 C50,66 47,67 45,67" />
            <path d="M50,64 C50,66 53,67 55,67" />
            <!-- Eyes -->
            <circle cx="41" cy="46" r="3" fill="url(#template-grad)" stroke="none" />
            <circle cx="59" cy="46" r="3" fill="url(#template-grad)" stroke="none" />
            <!-- Happy cheeks -->
            <path d="M34,51 C34,53 37,55 39,53" opacity="0.6" />
            <path d="M66,51 C66,53 63,55 61,53" opacity="0.6" />
          </g>
        </svg>
      `;

    case 'cozy-cat':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          ${gradientDef}
          <circle cx="50" cy="50" r="48" fill="url(#template-grad)" />
          
          <!-- Cat in Heart silhouette -->
          <g fill="#ffffff">
            <!-- Main Cat body curled in heart shape -->
            <path d="M50,82 C48,82 25,62 25,45 C25,32 35,22 47,22 C52,22 55,25 58,28 C61,25 64,22 69,22 C81,22 91,32 91,45 C91,55 83,67 71,76 L50,82 Z" opacity="0.15" />
            
            <!-- Curled Cat outline body -->
            <path d="M50,26 C37,26 28,35 28,48 C28,64 45,76 50,80 C55,76 72,64 72,48 C72,42 69,37 64,34 C64,28 58,28 58,33 C55,30 52,28 50,26 Z" opacity="0.2" />
            
            <!-- Sleek Kitty Silhouette -->
            <path d="M50,76 C41,72 34,60 34,48 C34,39 41,32 50,32 C54,32 57,34 59,37 C61,34 65,32 68,32 C77,32 84,39 84,48 C84,54 80,62 74,68 C73,69 71,68 70,67 C68,65 68,61 71,59 C75,55 77,50 77,46 C77,41 73,37 68,37 C64,37 61,41 61,46 C61,48 59,50 57,50 C55,50 53,48 53,46 C53,43 51,41 49,41 C47,41 45,43 45,46 C45,56 53,62 57,65 L50,76 Z" />
            
            <!-- Tiny Cat Ears on the head -->
            <path d="M44,33 L41,25 L47,29 Z" />
            <path d="M56,33 L59,25 L53,29 Z" />
            
            <!-- Sleeping whiskers and eyes inside -->
            <path d="M40,43 Q43,45 46,43" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none" />
            <path d="M60,43 Q57,45 54,43" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none" />
          </g>
        </svg>
      `;

    case 'bubble-bath':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          ${gradientDef}
          <circle cx="50" cy="50" r="48" fill="url(#template-grad)" />
          
          <!-- Bathtub body -->
          <path d="M22,50 C22,46 78,46 78,50 C78,60 70,68 50,68 C30,68 22,60 22,50 Z" fill="#ffffff" />
          <!-- Bathtub rim -->
          <rect x="18" y="47" width="64" height="4" rx="2" fill="#ffffff" />
          <!-- Tub feet -->
          <path d="M28,67 L25,74 L29,74 Z" fill="#ffffff" opacity="0.9" />
          <path d="M72,67 L75,74 L71,74 Z" fill="#ffffff" opacity="0.9" />

          <!-- Big Paw rising from tub -->
          <g fill="url(#template-grad)">
            <circle cx="50" cy="38" r="7" />
            <circle cx="41" cy="31" r="3.2" />
            <circle cx="47" cy="27" r="3.5" />
            <circle cx="53" cy="27" r="3.5" />
            <circle cx="59" cy="31" r="3.2" />
          </g>

          <!-- Soap bubbles (translucent white circles) -->
          <circle cx="25" cy="43" r="5" fill="#ffffff" opacity="0.8" />
          <circle cx="32" cy="40" r="6" fill="#ffffff" opacity="0.85" />
          <circle cx="39" cy="44" r="4" fill="#ffffff" opacity="0.9" />
          <circle cx="63" cy="43" r="5.5" fill="#ffffff" opacity="0.8" />
          <circle cx="70" cy="40" r="6" fill="#ffffff" opacity="0.85" />
          <circle cx="76" cy="44" r="4" fill="#ffffff" opacity="0.9" />
          <circle cx="48" cy="46" r="3.5" fill="#ffffff" opacity="0.95" />
          <circle cx="54" cy="46" r="3.5" fill="#ffffff" opacity="0.95" />

          <!-- Little floating bubbles -->
          <circle cx="30" cy="24" r="3" fill="#ffffff" opacity="0.6" stroke="#ffffff" stroke-width="0.5" />
          <circle cx="72" cy="22" r="2.5" fill="#ffffff" opacity="0.5" stroke="#ffffff" stroke-width="0.5" />
          <circle cx="50" cy="16" r="3.5" fill="#ffffff" opacity="0.7" stroke="#ffffff" stroke-width="0.5" />
        </svg>
      `;

    case 'heart-care':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          ${gradientDef}
          <rect width="100" height="100" rx="24" fill="url(#template-grad)" />
          <path d="M50,84 C48,84 18,58 18,38 C18,24 28,15 41,15 C46,15 49,18 50,20 C51,18 54,15 59,15 C72,15 82,24 82,38 C82,58 52,84 50,84 Z" fill="#ffffff" />
          
          <!-- Cross & Pets inside the heart -->
          <!-- Medical green/blue cross -->
          <rect x="46" y="32" width="8" height="24" rx="2" fill="url(#template-grad)" />
          <rect x="38" y="40" width="24" height="8" rx="2" fill="url(#template-grad)" />

          <!-- Cutout of cute dog and cat -->
          <g fill="#ffffff">
            <!-- Dog snout outline intersecting bottom of cross -->
            <path d="M30,56 C34,50 42,48 46,52 L42,66 C38,66 32,62 30,56 Z" fill="url(#template-grad)" opacity="0.9" />
            <!-- Cat head outline on other side -->
            <path d="M70,56 C66,50 58,48 54,52 L58,66 C62,66 68,62 70,56 Z" fill="url(#template-grad)" opacity="0.9" />
            <!-- Inner ears -->
            <path d="M32,50 L27,41 L35,46 Z" fill="#ffffff" />
            <path d="M68,50 L73,41 L65,46 Z" fill="#ffffff" />
          </g>
        </svg>
      `;

    default:
      return '';
  }
}

export function getSvgDataUri(templateId: string, colorClass: string): string {
  const svgStr = getSvgString(templateId, colorClass);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}
