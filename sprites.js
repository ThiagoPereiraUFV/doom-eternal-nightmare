// SVG Sprite System for realistic game sprites
const SVGSprites = {
  // Wall textures
  walls: {
    concrete: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <filter id="concreteNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="1"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <linearGradient id="concreteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#909090;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#787878;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#606060;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#concreteGrad)"/>
      <rect width="256" height="256" fill="#808080" opacity="0.3" filter="url(#concreteNoise)"/>
      <!-- Cracks and imperfections -->
      <path d="M 30 20 Q 35 80 40 140 L 42 142 L 38 138 Q 33 78 28 22 Z" fill="#505050" opacity="0.4"/>
      <path d="M 180 60 L 185 62 L 220 100 L 218 102 Z" fill="#505050" opacity="0.3"/>
      <path d="M 90 200 Q 120 205 150 200" stroke="#505050" stroke-width="1" fill="none" opacity="0.5"/>
      <!-- Weathering spots -->
      <circle cx="70" cy="90" r="8" fill="#606060" opacity="0.3"/>
      <circle cx="190" cy="150" r="12" fill="#707070" opacity="0.2"/>
      <circle cx="140" cy="40" r="6" fill="#585858" opacity="0.3"/>
    </svg>`,

    brick: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <filter id="brickTexture">
          <feTurbulence type="fractalNoise" baseFrequency="2.5" numOctaves="3"/>
          <feColorMatrix type="saturate" values="0.3"/>
        </filter>
        <radialGradient id="brickGrad1" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#b86040;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b4020;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="brickGrad2" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#a85538;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7a3018;stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Mortar background -->
      <rect width="256" height="256" fill="#6a6560"/>

      <!-- Brick rows with offset pattern -->
      <!-- Row 1 -->
      <rect x="2" y="2" width="120" height="58" fill="url(#brickGrad1)" filter="url(#brickTexture)"/>
      <rect x="126" y="2" width="128" height="58" fill="url(#brickGrad2)" filter="url(#brickTexture)"/>
      <!-- Row 2 (offset) -->
      <rect x="2" y="64" width="58" height="58" fill="url(#brickGrad2)" filter="url(#brickTexture)"/>
      <rect x="64" y="64" width="120" height="58" fill="url(#brickGrad1)" filter="url(#brickTexture)"/>
      <rect x="188" y="64" width="66" height="58" fill="url(#brickGrad2)" filter="url(#brickTexture)"/>
      <!-- Row 3 -->
      <rect x="2" y="126" width="120" height="58" fill="url(#brickGrad1)" filter="url(#brickTexture)"/>
      <rect x="126" y="126" width="128" height="58" fill="url(#brickGrad2)" filter="url(#brickTexture)"/>
      <!-- Row 4 (offset) -->
      <rect x="2" y="188" width="58" height="66" fill="url(#brickGrad2)" filter="url(#brickTexture)"/>
      <rect x="64" y="188" width="120" height="66" fill="url(#brickGrad1)" filter="url(#brickTexture)"/>
      <rect x="188" y="188" width="66" height="66" fill="url(#brickGrad2)" filter="url(#brickTexture)"/>

      <!-- Add depth shadows to bricks -->
      <g opacity="0.3">
        <rect x="2" y="58" width="120" height="2" fill="#000"/>
        <rect x="126" y="58" width="128" height="2" fill="#000"/>
        <rect x="2" y="120" width="58" height="2" fill="#000"/>
        <rect x="64" y="120" width="120" height="2" fill="#000"/>
        <rect x="188" y="120" width="66" height="2" fill="#000"/>
      </g>
    </svg>`,

    metal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="metalBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8090a0;stop-opacity:1" />
          <stop offset="30%" style="stop-color:#606878;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#505868;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#404858;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="rivetGrad" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#a0b0c0;stop-opacity:1" />
          <stop offset="60%" style="stop-color:#707880;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#404850;stop-opacity:1" />
        </radialGradient>
        <filter id="metalTexture">
          <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
      </defs>

      <!-- Base metal -->
      <rect width="256" height="256" fill="url(#metalBase)"/>
      <rect width="256" height="256" fill="#606870" opacity="0.2" filter="url(#metalTexture)"/>

      <!-- Panel seams (darker lines) -->
      <rect x="0" y="84" width="256" height="4" fill="#303840" opacity="0.8"/>
      <rect x="0" y="168" width="256" height="4" fill="#303840" opacity="0.8"/>
      <rect x="84" y="0" width="4" height="256" fill="#303840" opacity="0.8"/>
      <rect x="168" y="0" width="4" height="256" fill="#303840" opacity="0.8"/>

      <!-- Highlights on edges -->
      <rect x="0" y="82" width="256" height="1" fill="#9098a8" opacity="0.4"/>
      <rect x="82" y="0" width="1" height="256" fill="#9098a8" opacity="0.4"/>

      <!-- Rivets at panel corners -->
      <g>
        <!-- Top row -->
        <circle cx="20" cy="20" r="6" fill="url(#rivetGrad)"/>
        <circle cx="20" cy="20" r="3" fill="#303840"/>
        <circle cx="128" cy="20" r="6" fill="url(#rivetGrad)"/>
        <circle cx="128" cy="20" r="3" fill="#303840"/>
        <circle cx="236" cy="20" r="6" fill="url(#rivetGrad)"/>
        <circle cx="236" cy="20" r="3" fill="#303840"/>

        <!-- Middle row -->
        <circle cx="20" cy="128" r="6" fill="url(#rivetGrad)"/>
        <circle cx="20" cy="128" r="3" fill="#303840"/>
        <circle cx="128" cy="128" r="6" fill="url(#rivetGrad)"/>
        <circle cx="128" cy="128" r="3" fill="#303840"/>
        <circle cx="236" cy="128" r="6" fill="url(#rivetGrad)"/>
        <circle cx="236" cy="128" r="3" fill="#303840"/>

        <!-- Bottom row -->
        <circle cx="20" cy="236" r="6" fill="url(#rivetGrad)"/>
        <circle cx="20" cy="236" r="3" fill="#303840"/>
        <circle cx="128" cy="236" r="6" fill="url(#rivetGrad)"/>
        <circle cx="128" cy="236" r="3" fill="#303840"/>
        <circle cx="236" cy="236" r="6" fill="url(#rivetGrad)"/>
        <circle cx="236" cy="236" r="3" fill="#303840"/>
      </g>

      <!-- Scratches and wear -->
      <path d="M 40 50 L 180 60" stroke="#505860" stroke-width="1" opacity="0.3"/>
      <path d="M 90 140 L 200 145" stroke="#505860" stroke-width="0.5" opacity="0.4"/>
      <path d="M 30 200 Q 60 190 90 205" stroke="#505860" stroke-width="0.8" opacity="0.3"/>
    </svg>`,

    stone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <filter id="stoneTexture">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="5" seed="2"/>
          <feColorMatrix type="saturate" values="0.2"/>
        </filter>
        <radialGradient id="stone1" cx="40%" cy="40%">
          <stop offset="0%" style="stop-color:#989888;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6a6a5a;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="stone2" cx="60%" cy="40%">
          <stop offset="0%" style="stop-color:#8a8a7a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5a5a4a;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="stone3" cx="50%" cy="60%">
          <stop offset="0%" style="stop-color:#7a7a6a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4a4a3a;stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Mortar background -->
      <rect width="256" height="256" fill="#5a5a50"/>

      <!-- Large irregular stone blocks -->
      <!-- Top row -->
      <path d="M 2 2 L 118 2 L 120 5 L 122 88 L 118 90 L 2 88 Z" fill="url(#stone1)" filter="url(#stoneTexture)"/>
      <path d="M 126 2 L 254 2 L 254 92 L 250 90 L 126 88 L 124 5 Z" fill="url(#stone2)" filter="url(#stoneTexture)"/>

      <!-- Middle row -->
      <path d="M 2 96 L 80 94 L 82 98 L 84 164 L 80 166 L 2 164 Z" fill="url(#stone3)" filter="url(#stoneTexture)"/>
      <path d="M 90 94 L 254 96 L 254 168 L 250 166 L 92 164 L 90 98 Z" fill="url(#stone1)" filter="url(#stoneTexture)"/>

      <!-- Bottom row -->
      <path d="M 2 172 L 140 170 L 142 174 L 144 252 L 140 254 L 2 254 Z" fill="url(#stone2)" filter="url(#stoneTexture)"/>
      <path d="M 150 170 L 254 172 L 254 254 L 250 254 L 148 252 L 148 174 Z" fill="url(#stone3)" filter="url(#stoneTexture)"/>

      <!-- Mortar lines (dark shadows) -->
      <g stroke="#4a4a40" stroke-width="3" fill="none" opacity="0.6">
        <line x1="2" y1="90" x2="254" y2="90"/>
        <line x1="122" y1="2" x2="124" y2="90"/>
        <line x1="82" y1="94" x2="84" y2="166"/>
        <line x1="2" y1="166" x2="254" y2="168"/>
        <line x1="142" y1="170" x2="144" y2="254"/>
      </g>

      <!-- Highlights on top edges of stones -->
      <g stroke="#a8a898" stroke-width="1" fill="none" opacity="0.3">
        <line x1="2" y1="3" x2="118" y2="3"/>
        <line x1="126" y1="3" x2="254" y2="3"/>
        <line x1="3" y1="96" x2="80" y2="95"/>
        <line x1="90" y1="95" x2="254" y2="97"/>
      </g>

      <!-- Cracks and weathering -->
      <g stroke="#5a5a4a" stroke-width="0.5" fill="none" opacity="0.4">
        <path d="M 50 20 Q 55 45 52 70"/>
        <path d="M 180 30 L 185 60 L 180 75"/>
        <path d="M 40 120 Q 50 135 45 150"/>
        <path d="M 200 110 L 205 140"/>
      </g>
    </svg>`,
  },

  // Enemy sprites
  enemies: {
    imp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150">
      <!-- Body - muscular demon -->
      <defs>
        <radialGradient id="impBody" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#c84040;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#8b2020;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4a1010;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="impHead" cx="40%" cy="30%">
          <stop offset="0%" style="stop-color:#d85050;stop-opacity:1" />
          <stop offset="60%" style="stop-color:#a03030;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5a1818;stop-opacity:1" />
        </radialGradient>
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Shadow -->
      <ellipse cx="50" cy="145" rx="30" ry="5" fill="#000" opacity="0.3"/>

      <!-- Legs -->
      <path d="M 35 100 L 30 140 L 25 145 L 32 145 L 37 140 Z" fill="url(#impBody)" stroke="#4a1010" stroke-width="1"/>
      <path d="M 65 100 L 70 140 L 75 145 L 68 145 L 63 140 Z" fill="url(#impBody)" stroke="#4a1010" stroke-width="1"/>

      <!-- Torso -->
      <ellipse cx="50" cy="75" rx="25" ry="35" fill="url(#impBody)" filter="url(#shadow)"/>

      <!-- Muscle definition -->
      <ellipse cx="40" cy="70" rx="8" ry="12" fill="#a03030" opacity="0.4"/>
      <ellipse cx="60" cy="70" rx="8" ry="12" fill="#a03030" opacity="0.4"/>
      <path d="M 50 60 Q 50 75 50 90" stroke="#6a1515" stroke-width="2" fill="none" opacity="0.6"/>

      <!-- Arms -->
      <path d="M 25 65 Q 10 75 15 95 L 20 93 Q 18 78 28 70 Z" fill="url(#impBody)" stroke="#4a1010" stroke-width="1"/>
      <path d="M 75 65 Q 90 75 85 95 L 80 93 Q 82 78 72 70 Z" fill="url(#impBody)" stroke="#4a1010" stroke-width="1"/>

      <!-- Claws -->
      <g fill="#2a0a0a" stroke="#000" stroke-width="0.5">
        <path d="M 15 95 L 12 105 L 14 106 Z"/>
        <path d="M 17 95 L 14 105 L 16 106 Z"/>
        <path d="M 19 95 L 16 105 L 18 106 Z"/>
        <path d="M 85 95 L 88 105 L 86 106 Z"/>
        <path d="M 83 95 L 86 105 L 84 106 Z"/>
        <path d="M 81 95 L 84 105 L 82 106 Z"/>
      </g>

      <!-- Head -->
      <ellipse cx="50" cy="40" rx="20" ry="25" fill="url(#impHead)" filter="url(#shadow)"/>

      <!-- Horns -->
      <path d="M 35 25 Q 30 15 28 10 Q 30 12 35 20 Z" fill="#3a1010" stroke="#000" stroke-width="1"/>
      <path d="M 65 25 Q 70 15 72 10 Q 70 12 65 20 Z" fill="#3a1010" stroke="#000" stroke-width="1"/>

      <!-- Eyes - glowing -->
      <ellipse cx="42" cy="38" rx="5" ry="7" fill="#ff3030"/>
      <ellipse cx="58" cy="38" rx="5" ry="7" fill="#ff3030"/>
      <ellipse cx="42" cy="38" rx="3" ry="4" fill="#ffff00" opacity="0.8"/>
      <ellipse cx="58" cy="38" rx="3" ry="4" fill="#ffff00" opacity="0.8"/>

      <!-- Mouth/teeth -->
      <path d="M 40 48 Q 50 55 60 48" stroke="#000" stroke-width="2" fill="none"/>
      <g fill="#fff">
        <rect x="43" y="48" width="2" height="4"/>
        <rect x="47" y="48" width="2" height="5"/>
        <rect x="51" y="48" width="2" height="5"/>
        <rect x="55" y="48" width="2" height="4"/>
      </g>
    </svg>`,

    skeleton: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160">
      <defs>
        <radialGradient id="boneGrad" cx="40%" cy="30%">
          <stop offset="0%" style="stop-color:#f5f5dc;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#d3d3bb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a8a89a;stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Shadow -->
      <ellipse cx="50" cy="155" rx="25" ry="4" fill="#000" opacity="0.3"/>

      <!-- Leg bones -->
      <g fill="url(#boneGrad)" stroke="#8a8a7a" stroke-width="1">
        <!-- Left leg -->
        <rect x="35" y="100" width="6" height="45" rx="3"/>
        <rect x="35" y="140" width="8" height="15" rx="2"/>
        <!-- Right leg -->
        <rect x="59" y="100" width="6" height="45" rx="3"/>
        <rect x="57" y="140" width="8" height="15" rx="2"/>

        <!-- Knee joints -->
        <circle cx="38" cy="120" r="5"/>
        <circle cx="62" cy="120" r="5"/>
      </g>

      <!-- Pelvis -->
      <ellipse cx="50" cy="95" rx="20" ry="12" fill="url(#boneGrad)" stroke="#8a8a7a" stroke-width="1"/>

      <!-- Spine -->
      <rect x="47" y="45" width="6" height="50" rx="2" fill="url(#boneGrad)" stroke="#8a8a7a" stroke-width="1"/>
      <g fill="#a8a89a" opacity="0.5">
        <circle cx="50" cy="50" r="3"/>
        <circle cx="50" cy="60" r="3"/>
        <circle cx="50" cy="70" r="3"/>
        <circle cx="50" cy="80" r="3"/>
        <circle cx="50" cy="90" r="3"/>
      </g>

      <!-- Ribcage -->
      <ellipse cx="50" cy="60" rx="22" ry="28" fill="none" stroke="url(#boneGrad)" stroke-width="2"/>
      <path d="M 35 50 Q 28 60 35 70" stroke="url(#boneGrad)" stroke-width="2" fill="none"/>
      <path d="M 65 50 Q 72 60 65 70" stroke="url(#boneGrad)" stroke-width="2" fill="none"/>
      <path d="M 37 55 Q 30 60 37 65" stroke="url(#boneGrad)" stroke-width="1.5" fill="none"/>
      <path d="M 63 55 Q 70 60 63 65" stroke="url(#boneGrad)" stroke-width="1.5" fill="none"/>

      <!-- Arms -->
      <g fill="url(#boneGrad)" stroke="#8a8a7a" stroke-width="1">
        <!-- Left arm -->
        <rect x="20" y="50" width="5" height="35" rx="2" transform="rotate(-15 22.5 67.5)"/>
        <rect x="14" y="82" width="5" height="30" rx="2" transform="rotate(-25 16.5 97)"/>
        <circle cx="22" cy="70" r="4"/>
        <!-- Right arm -->
        <rect x="75" y="50" width="5" height="35" rx="2" transform="rotate(15 77.5 67.5)"/>
        <rect x="81" y="82" width="5" height="30" rx="2" transform="rotate(25 83.5 97)"/>
        <circle cx="78" cy="70" r="4"/>
      </g>

      <!-- Hands (bony) -->
      <g fill="url(#boneGrad)" stroke="#8a8a7a" stroke-width="0.5">
        <rect x="10" y="110" width="2" height="8"/>
        <rect x="13" y="110" width="2" height="9"/>
        <rect x="16" y="110" width="2" height="8"/>
        <rect x="84" y="110" width="2" height="8"/>
        <rect x="87" y="110" width="2" height="9"/>
        <rect x="90" y="110" width="2" height="8"/>
      </g>

      <!-- Skull -->
      <ellipse cx="50" cy="30" rx="18" ry="22" fill="url(#boneGrad)" stroke="#8a8a7a" stroke-width="1.5"/>

      <!-- Eye sockets - glowing red -->
      <ellipse cx="42" cy="28" rx="6" ry="8" fill="#000"/>
      <ellipse cx="58" cy="28" rx="6" ry="8" fill="#000"/>
      <ellipse cx="42" cy="28" rx="4" ry="5" fill="#ff0000" opacity="0.8"/>
      <ellipse cx="58" cy="28" rx="4" ry="5" fill="#ff0000" opacity="0.8"/>

      <!-- Nasal cavity -->
      <ellipse cx="50" cy="36" rx="4" ry="5" fill="#000"/>

      <!-- Teeth -->
      <g fill="#f5f5dc">
        <rect x="40" y="42" width="3" height="5"/>
        <rect x="44" y="42" width="3" height="6"/>
        <rect x="48" y="42" width="3" height="6"/>
        <rect x="52" y="42" width="3" height="6"/>
        <rect x="56" y="42" width="3" height="5"/>
      </g>

      <!-- Jaw -->
      <path d="M 35 45 L 38 52 L 62 52 L 65 45" stroke="#8a8a7a" stroke-width="1.5" fill="url(#boneGrad)"/>
    </svg>`,

    ghost: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">
      <defs>
        <radialGradient id="ghostGlow" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
          <stop offset="40%" style="stop-color:#88ccff;stop-opacity:0.7" />
          <stop offset="70%" style="stop-color:#4488cc;stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:#2244aa;stop-opacity:0.2" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="ethereal">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="turbulence"/>
          <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>

      <!-- Outer glow aura -->
      <ellipse cx="50" cy="60" rx="45" ry="55" fill="url(#ghostGlow)" opacity="0.3" filter="url(#glow)"/>

      <!-- Main ghostly body -->
      <path d="M 50 20 Q 25 30 20 60 Q 20 90 25 110 Q 25 115 22 120 Q 25 118 28 120 Q 28 115 30 110 Q 35 115 38 120 Q 38 115 40 110 Q 45 115 48 120 Q 48 115 50 110 Q 55 115 58 120 Q 58 115 60 110 Q 65 115 68 120 Q 68 115 70 110 Q 75 115 78 120 Q 75 118 78 110 Q 80 90 80 60 Q 75 30 50 20 Z"
            fill="url(#ghostGlow)" opacity="0.8" filter="url(#ethereal)"/>

      <!-- Inner wispy trails -->
      <g opacity="0.4">
        <ellipse cx="50" cy="90" rx="15" ry="25" fill="#88ccff"/>
        <ellipse cx="45" cy="105" rx="12" ry="20" fill="#6699dd"/>
        <ellipse cx="55" cy="105" rx="12" ry="20" fill="#6699dd"/>
      </g>

      <!-- Eyes - dark voids with glow -->
      <g filter="url(#glow)">
        <ellipse cx="38" cy="50" rx="8" ry="12" fill="#000" opacity="0.9"/>
        <ellipse cx="62" cy="50" rx="8" ry="12" fill="#000" opacity="0.9"/>
        <ellipse cx="38" cy="48" rx="5" ry="8" fill="#0088ff" opacity="0.8"/>
        <ellipse cx="62" cy="48" rx="5" ry="8" fill="#0088ff" opacity="0.8"/>
        <ellipse cx="38" cy="46" rx="2" ry="3" fill="#66ddff"/>
        <ellipse cx="62" cy="46" rx="2" ry="3" fill="#66ddff"/>
      </g>

      <!-- Ethereal energy wisps -->
      <g opacity="0.5" stroke="#88ccff" stroke-width="2" fill="none">
        <path d="M 30 70 Q 15 75 10 85">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
                   values="M 30 70 Q 15 75 10 85; M 30 70 Q 18 78 12 88; M 30 70 Q 15 75 10 85"/>
        </path>
        <path d="M 70 70 Q 85 75 90 85">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
                   values="M 70 70 Q 85 75 90 85; M 70 70 Q 82 78 88 88; M 70 70 Q 85 75 90 85"/>
        </path>
      </g>

      <!-- Mouth (if visible - dark void) -->
      <ellipse cx="50" cy="68" rx="8" ry="6" fill="#000" opacity="0.6"/>
    </svg>`,

    brute: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 170">
      <defs>
        <radialGradient id="bruteBody" cx="40%" cy="35%">
          <stop offset="0%" style="stop-color:#d4a574;stop-opacity:1" />
          <stop offset="60%" style="stop-color:#a87850;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6b4423;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="bruteMuscle" cx="45%" cy="40%">
          <stop offset="0%" style="stop-color:#c49464;stop-opacity:1" />
          <stop offset="80%" style="stop-color:#8b5a3c;stop-opacity:1" />
        </radialGradient>
        <filter id="bruteShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="3" dy="4"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Shadow -->
      <ellipse cx="60" cy="165" rx="40" ry="6" fill="#000" opacity="0.4"/>

      <!-- Massive legs -->
      <g fill="url(#bruteBody)" stroke="#5a3a1a" stroke-width="1.5">
        <rect x="35" y="105" width="20" height="55" rx="5"/>
        <rect x="65" y="105" width="20" height="55" rx="5"/>
        <!-- Thigh muscles -->
        <ellipse cx="45" cy="120" rx="12" ry="18" fill="url(#bruteMuscle)" opacity="0.6"/>
        <ellipse cx="75" cy="120" rx="12" ry="18" fill="url(#bruteMuscle)" opacity="0.6"/>
      </g>

      <!-- Feet -->
      <ellipse cx="45" cy="165" rx="15" ry="8" fill="#5a3a1a" stroke="#3a2a0a" stroke-width="1"/>
      <ellipse cx="75" cy="165" rx="15" ry="8" fill="#5a3a1a" stroke="#3a2a0a" stroke-width="1"/>

      <!-- Massive torso -->
      <ellipse cx="60" cy="75" rx="35" ry="45" fill="url(#bruteBody)" filter="url(#bruteShadow)"/>

      <!-- Chest/abs definition -->
      <g opacity="0.5">
        <ellipse cx="60" cy="60" rx="25" ry="15" fill="#a87850"/>
        <path d="M 60 75 L 60 95" stroke="#6b4423" stroke-width="3"/>
        <path d="M 50 80 L 70 80" stroke="#6b4423" stroke-width="2"/>
        <path d="M 52 88 L 68 88" stroke="#6b4423" stroke-width="2"/>
      </g>

      <!-- Enormous arms -->
      <g fill="url(#bruteBody)" stroke="#5a3a1a" stroke-width="1.5">
        <!-- Left arm -->
        <ellipse cx="25" cy="70" rx="15" ry="25" transform="rotate(-20 25 70)"/>
        <ellipse cx="15" cy="95" rx="13" ry="22" transform="rotate(-30 15 95)"/>
        <!-- Bicep bulge -->
        <ellipse cx="22" cy="75" rx="10" ry="14" fill="url(#bruteMuscle)" opacity="0.7" transform="rotate(-20 22 75)"/>

        <!-- Right arm -->
        <ellipse cx="95" cy="70" rx="15" ry="25" transform="rotate(20 95 70)"/>
        <ellipse cx="105" cy="95" rx="13" ry="22" transform="rotate(30 105 95)"/>
        <!-- Bicep bulge -->
        <ellipse cx="98" cy="75" rx="10" ry="14" fill="url(#bruteMuscle)" opacity="0.7" transform="rotate(20 98 75)"/>
      </g>

      <!-- Fists -->
      <g fill="#8b5a3c" stroke="#5a3a1a" stroke-width="1">
        <ellipse cx="10" cy="115" rx="10" ry="12"/>
        <ellipse cx="110" cy="115" rx="10" ry="12"/>
      </g>

      <!-- Spikes/claws on fists -->
      <g fill="#3a2a0a">
        <polygon points="8,115 6,125 10,120"/>
        <polygon points="12,115 14,125 10,120"/>
        <polygon points="108,115 106,125 110,120"/>
        <polygon points="112,115 114,125 110,120"/>
      </g>

      <!-- Head -->
      <ellipse cx="60" cy="35" rx="22" ry="28" fill="url(#bruteBody)" filter="url(#bruteShadow)"/>

      <!-- Horns/spikes -->
      <g fill="#3a2a0a" stroke="#2a1a0a" stroke-width="1">
        <path d="M 42 20 Q 38 10 35 5 L 40 12 Z"/>
        <path d="M 78 20 Q 82 10 85 5 L 80 12 Z"/>
        <polygon points="50,15 48,8 52,12"/>
        <polygon points="70,15 72,8 68,12"/>
      </g>

      <!-- Angry eyes - red glow -->
      <g>
        <ellipse cx="50" cy="33" rx="6" ry="9" fill="#000"/>
        <ellipse cx="70" cy="33" rx="6" ry="9" fill="#000"/>
        <ellipse cx="50" cy="33" rx="4" ry="6" fill="#ff2020" opacity="0.9"/>
        <ellipse cx="70" cy="33" rx="4" ry="6" fill="#ff2020" opacity="0.9"/>
        <ellipse cx="50" cy="31" rx="2" ry="3" fill="#ff8080"/>
        <ellipse cx="70" cy="31" rx="2" ry="3" fill="#ff8080"/>
      </g>

      <!-- Snarling mouth -->
      <path d="M 48 45 Q 60 52 72 45" stroke="#000" stroke-width="3" fill="none"/>
      <g fill="#fff">
        <polygon points="50,45 48,50 52,48"/>
        <polygon points="58,47 56,52 60,50"/>
        <polygon points="66,47 64,52 68,50"/>
        <polygon points="72,45 70,50 74,48"/>
      </g>

      <!-- Scars -->
      <g stroke="#6b4423" stroke-width="1.5" fill="none" opacity="0.6">
        <path d="M 52 28 L 48 38"/>
        <path d="M 65 60 L 75 70"/>
      </g>
    </svg>`,
  },

  // Weapon sprites (for weapon canvas)
  weapons: {
    pistol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160">
      <defs>
        <linearGradient id="gunMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6a6a6a;stop-opacity:1" />
          <stop offset="30%" style="stop-color:#404040;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#5a5a5a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3a3a3a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2a2a2a;stop-opacity:1" />
        </linearGradient>
        <filter id="weaponShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Slide (top part) -->
      <rect x="35" y="50" width="140" height="24" rx="2" fill="#4a4a4a" filter="url(#weaponShadow)"/>

      <!-- Slide serrations -->
      <g fill="#2a2a2a">
        <rect x="140" y="53" width="2" height="18"/>
        <rect x="145" y="53" width="2" height="18"/>
        <rect x="150" y="53" width="2" height="18"/>
        <rect x="155" y="53" width="2" height="18"/>
        <rect x="160" y="53" width="2" height="18"/>
        <rect x="165" y="53" width="2" height="18"/>
      </g>

      <!-- Barrel extending forward -->
      <rect x="175" y="55" width="110" height="14" rx="2" fill="url(#gunMetal)" filter="url(#weaponShadow)"/>
      <!-- Barrel highlight -->
      <rect x="177" y="57" width="105" height="3" fill="rgba(150,150,150,0.3)"/>

      <!-- Muzzle -->
      <circle cx="285" cy="62" r="7" fill="#1a1a1a"/>
      <circle cx="285" cy="62" r="5" fill="#0a0a0a"/>

      <!-- Frame/receiver -->
      <rect x="35" y="74" width="140" height="32" rx="2" fill="#3a3a3a" filter="url(#weaponShadow)"/>

      <!-- Ejection port -->
      <rect x="120" y="52" width="20" height="10" fill="#1a1a1a"/>

      <!-- Trigger guard -->
      <path d="M 80 106 Q 70 118 80 130" stroke="#4a4a4a" stroke-width="4" fill="none"/>

      <!-- Trigger -->
      <rect x="75" y="110" width="12" height="22" rx="2" fill="#5a5a5a"/>

      <!-- Grip (vertical) -->
      <path d="M 35 106 L 35 150 Q 35 155 40 155 L 70 155 Q 75 155 75 150 L 75 106 Z" fill="url(#grip)" filter="url(#weaponShadow)"/>

      <!-- Grip texture lines -->
      <g stroke="#2a2a2a" stroke-width="1.5">
        <line x1="40" y1="115" x2="70" y2="115"/>
        <line x1="40" y1="122" x2="70" y2="122"/>
        <line x1="40" y1="129" x2="70" y2="129"/>
        <line x1="40" y1="136" x2="70" y2="136"/>
        <line x1="40" y1="143" x2="70" y2="143"/>
      </g>

      <!-- Front sight -->
      <rect x="270" y="45" width="6" height="10" fill="#5a5a5a"/>
      <rect x="271" y="47" width="4" height="4" fill="#00ff00"/>

      <!-- Rear sight -->
      <g fill="#4a4a4a">
        <rect x="130" y="44" width="4" height="8"/>
        <rect x="146" y="44" width="4" height="8"/>
      </g>

      <!-- Hammer -->
      <path d="M 45 74 L 40 65 L 50 65 Z" fill="#3a3a3a"/>

      <!-- Magazine -->
      <rect x="85" y="106" width="22" height="50" rx="2" fill="#3a3a3a"/>
      <rect x="87" y="108" width="18" height="46" rx="1" fill="#2a2a2a"/>
    </svg>`,

    shotgun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 180">
      <defs>
        <linearGradient id="wood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#a87850;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#8b5a3c;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6b4423;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="barrel" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="15%" style="stop-color:#3a3a3a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="85%" style="stop-color:#3a3a3a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
        <filter id="shotgunShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Stock (wooden, pointing left/back) -->
      <path d="M 20 70 L 20 110 Q 20 115 25 115 L 70 115 L 70 70 Q 70 65 65 65 L 25 65 Q 20 65 20 70 Z" fill="url(#wood)" filter="url(#shotgunShadow)"/>

      <!-- Wood grain on stock -->
      <g stroke="#6b4423" stroke-width="1" fill="none" opacity="0.4">
        <path d="M 25 72 Q 35 85 30 108"/>
        <path d="M 35 70 Q 45 85 40 110"/>
        <path d="M 50 70 Q 60 85 55 110"/>
      </g>

      <!-- Receiver (metal) -->
      <rect x="70" y="65" width="80" height="50" rx="3" fill="#3a3a3a" filter="url(#shotgunShadow)"/>

      <!-- Loading port -->
      <rect x="80" y="73" width="30" height="14" fill="#1a1a1a"/>

      <!-- Ejection port -->
      <rect x="120" y="70" width="18" height="10" fill="#1a1a1a"/>

      <!-- Pump/foregrip (wood) -->
      <rect x="180" y="70" width="40" height="40" rx="4" fill="url(#wood)" filter="url(#shotgunShadow)"/>
      <rect x="182" y="72" width="36" height="36" rx="3" fill="none" stroke="#5a3a1a" stroke-width="2"/>

      <!-- Double barrel -->
      <rect x="220" y="70" width="200" height="40" rx="3" fill="url(#barrel)" filter="url(#shotgunShadow)"/>

      <!-- Barrel separation -->
      <line x1="320" y1="70" x2="320" y2="110" stroke="#0a0a0a" stroke-width="3"/>

      <!-- Barrel muzzle -->
      <g fill="#1a1a1a">
        <circle cx="420" cy="82" r="9" fill="#0a0a0a"/>
        <circle cx="420" cy="98" r="9" fill="#0a0a0a"/>
        <circle cx="420" cy="82" r="7"/>
        <circle cx="420" cy="98" r="7"/>
      </g>

      <!-- Front sight bead -->
      <rect x="410" y="63" width="5" height="10" fill="#5a5a5a"/>
      <circle cx="412" cy="66" r="2.5" fill="#ff6600"/>

      <!-- Trigger guard -->
      <path d="M 100 115 Q 90 127 100 139" stroke="#3a3a3a" stroke-width="5" fill="none"/>

      <!-- Trigger -->
      <rect x="95" y="120" width="12" height="22" rx="2" fill="#5a5a5a"/>

      <!-- Pump action rod -->
      <rect x="150" y="88" width="75" height="4" fill="#2a2a2a"/>

      <!-- Barrel bands -->
      <rect x="260" y="75" width="5" height="30" fill="#2a2a2a" rx="1"/>
      <rect x="360" y="75" width="5" height="30" fill="#2a2a2a" rx="1"/>

      <!-- Shell holder on receiver -->
      <g>
        <rect x="75" y="58" width="12" height="6" rx="1" fill="#4a3a2a"/>
        <rect x="90" y="58" width="12" height="6" rx="1" fill="#4a3a2a"/>
        <rect x="105" y="58" width="12" height="6" rx="1" fill="#4a3a2a"/>
        <!-- Shells -->
        <rect x="76" y="52" width="10" height="6" rx="1" fill="#d4af37" stroke="#8b7500"/>
        <rect x="91" y="52" width="10" height="6" rx="1" fill="#d4af37" stroke="#8b7500"/>
        <rect x="106" y="52" width="10" height="6" rx="1" fill="#d4af37" stroke="#8b7500"/>
      </g>
    </svg>`,

    rifle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 160">
      <defs>
        <linearGradient id="tacBlack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4a4a4a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="magazine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#5a5a5a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3a3a3a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2a2a2a;stop-opacity:1" />
        </linearGradient>
        <filter id="rifleShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Stock (collapsible tactical) -->
      <rect x="20" y="60" width="90" height="40" rx="3" fill="url(#tacBlack)" filter="url(#rifleShadow)"/>
      <!-- Stock texture panels -->
      <g stroke="#1a1a1a" stroke-width="1" fill="none">
        <rect x="25" y="63" width="18" height="34"/>
        <rect x="46" y="63" width="18" height="34"/>
        <rect x="67" y="63" width="18" height="34"/>
        <rect x="88" y="63" width="18" height="34"/>
      </g>

      <!-- Buffer tube -->
      <rect x="110" y="70" width="30" height="20" rx="10" fill="#2a2a2a"/>

      <!-- Lower Receiver -->
      <rect x="140" y="65" width="100" height="45" rx="2" fill="#3a3a3a" filter="url(#rifleShadow)"/>

      <!-- Upper Receiver -->
      <rect x="145" y="55" width="95" height="20" fill="#2a2a2a"/>

      <!-- Charging handle -->
      <rect x="150" y="57" width="18" height="14" fill="#4a4a4a"/>

      <!-- Ejection port -->
      <rect x="180" y="58" width="38" height="14" fill="#1a1a1a"/>
      <circle cx="215" cy="65" r="2" fill="#5a5a5a"/>

      <!-- Picatinny rail on top -->
      <rect x="145" y="50" width="150" height="5" fill="#2a2a2a"/>
      <g fill="#1a1a1a">
        <rect x="150" y="51" width="3" height="3"/>
        <rect x="158" y="51" width="3" height="3"/>
        <rect x="166" y="51" width="3" height="3"/>
        <rect x="174" y="51" width="3" height="3"/>
        <rect x="182" y="51" width="3" height="3"/>
        <rect x="190" y="51" width="3" height="3"/>
      </g>

      <!-- Handguard/rail system -->
      <rect x="240" y="60" width="120" height="40" rx="2" fill="url(#tacBlack)" filter="url(#rifleShadow)"/>

      <!-- Rail slots on handguard -->
      <g fill="#1a1a1a">
        <rect x="245" y="63" width="3" height="34"/>
        <rect x="253" y="63" width="3" height="34"/>
        <rect x="261" y="63" width="3" height="34"/>
        <rect x="269" y="63" width="3" height="34"/>
        <rect x="277" y="63" width="3" height="34"/>
        <rect x="285" y="63" width="3" height="34"/>
        <rect x="293" y="63" width="3" height="34"/>
        <rect x="301" y="63" width="3" height="34"/>
        <rect x="309" y="63" width="3" height="34"/>
        <rect x="317" y="63" width="3" height="34"/>
        <rect x="325" y="63" width="3" height="34"/>
        <rect x="333" y="63" width="3" height="34"/>
        <rect x="341" y="63" width="3" height="34"/>
        <rect x="349" y="63" width="3" height="34"/>
      </g>

      <!-- Gas block/front sight -->
      <rect x="355" y="65" width="10" height="30" fill="#2a2a2a"/>
      <rect x="357" y="58" width="6" height="8" fill="#4a4a4a"/>
      <circle cx="360" cy="60" r="2" fill="#00ff00"/>

      <!-- Barrel -->
      <rect x="365" y="68" width="150" height="24" rx="12" fill="#1a1a1a" filter="url(#rifleShadow)"/>
      <!-- Barrel highlight -->
      <rect x="367" y="70" width="145" height="4" fill="rgba(80,80,80,0.4)"/>

      <!-- Muzzle device/compensator -->
      <g fill="#2a2a2a" stroke="#1a1a1a" stroke-width="1">
        <rect x="515" y="65" width="20" height="30" rx="2"/>
        <rect x="517" y="68" width="3" height="24"/>
        <rect x="522" y="68" width="3" height="24"/>
        <rect x="527" y="68" width="3" height="24"/>
      </g>
      <circle cx="535" cy="80" r="12" fill="#1a1a1a"/>
      <circle cx="535" cy="80" r="9" fill="#0a0a0a"/>

      <!-- Magazine -->
      <rect x="175" y="110" width="28" height="60" rx="2" fill="url(#magazine)"/>
      <path d="M 175 125 Q 173 140 175 160" stroke="#2a2a2a" stroke-width="2" fill="none"/>
      <!-- Magazine window/ridges -->
      <g fill="#2a2a2a">
        <rect x="177" y="115" width="24" height="2"/>
        <rect x="177" y="125" width="24" height="2"/>
        <rect x="177" y="135" width="24" height="2"/>
        <rect x="177" y="145" width="24" height="2"/>
        <rect x="177" y="155" width="24" height="2"/>
      </g>

      <!-- Trigger guard -->
      <path d="M 160 110 Q 150 120 160 130" stroke="#3a3a3a" stroke-width="4" fill="none"/>

      <!-- Trigger -->
      <rect x="155" y="113" width="12" height="22" rx="2" fill="#5a5a5a"/>

      <!-- Pistol grip -->
      <path d="M 150 135 Q 145 155 155 175 L 170 175 L 170 138 Z" fill="url(#tacBlack)"/>
      <!-- Grip texture -->
      <g stroke="#1a1a1a" stroke-width="1" fill="none">
        <line x1="152" y1="145" x2="165" y2="145"/>
        <line x1="151" y1="152" x2="164" y2="152"/>
        <line x1="150" y1="159" x2="163" y2="159"/>
        <line x1="151" y1="166" x2="164" y2="166"/>
      </g>

      <!-- Rear sight -->
      <g fill="#3a3a3a">
        <rect x="245" y="83" width="5" height="10"/>
        <rect x="258" y="83" width="5" height="10"/>
      </g>

      <!-- Optics rail -->
      <rect x="180" y="80" width="80" height="5" fill="#2a2a2a"/>
      <g fill="#1a1a1a">
        <rect x="185" y="80" width="2" height="5"/>
        <rect x="195" y="80" width="2" height="5"/>
        <rect x="205" y="80" width="2" height="5"/>
        <rect x="215" y="80" width="2" height="5"/>
        <rect x="225" y="80" width="2" height="5"/>
        <rect x="235" y="80" width="2" height="5"/>
        <rect x="245" y="80" width="2" height="5"/>
        <rect x="255" y="80" width="2" height="5"/>
      </g>

      <!-- Bolt catch -->
      <rect x="148" y="108" width="6" height="8" rx="1" fill="#4a4a4a"/>

      <!-- Magazine release -->
      <circle cx="172" cy="125" r="3" fill="#3a3a3a"/>

      <!-- Forward assist -->
      <circle cx="270" cy="95" r="4" fill="#2a2a2a"/>
    </svg>`,
  },
};

// Helper function to create SVG sprite element
function createSVGSprite(svgString, width, height) {
  const img = new Image();
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  img.src = url;
  return new Promise((resolve) => {
    img.onload = () => {
      resolve({ img, url, width, height });
    };
  });
}

// Preload all sprites
const loadedSprites = {
  enemies: {},
  weapons: {},
  walls: {},
};

// Make SVGSprites globally available
window.SVGSprites = SVGSprites;

async function preloadSprites(onProgress) {
  const totalItems = Object.keys(SVGSprites.enemies).length + 3 + 4; // enemies + weapons + walls
  let loadedItems = 0;

  const updateProgress = () => {
    loadedItems++;
    if (onProgress) {
      const progress = 10 + (loadedItems / totalItems) * 70; // 10% to 80%
      onProgress(progress, `Loading ${loadedItems}/${totalItems} sprites...`);
    }
  };

  // Load enemy sprites
  for (const [name, svg] of Object.entries(SVGSprites.enemies)) {
    loadedSprites.enemies[name] = await createSVGSprite(svg, 100, 150);
    updateProgress();
  }

  // Load weapon sprites
  loadedSprites.weapons.pistol = await createSVGSprite(
    SVGSprites.weapons.pistol,
    200,
    300,
  );
  updateProgress();

  loadedSprites.weapons.shotgun = await createSVGSprite(
    SVGSprites.weapons.shotgun,
    300,
    250,
  );
  updateProgress();

  loadedSprites.weapons.rifle = await createSVGSprite(
    SVGSprites.weapons.rifle,
    400,
    220,
  );
  updateProgress();

  // Load wall textures
  loadedSprites.walls.concrete = await createSVGSprite(
    SVGSprites.walls.concrete,
    256,
    256,
  );
  updateProgress();

  loadedSprites.walls.brick = await createSVGSprite(
    SVGSprites.walls.brick,
    256,
    256,
  );
  updateProgress();

  loadedSprites.walls.metal = await createSVGSprite(
    SVGSprites.walls.metal,
    256,
    256,
  );
  updateProgress();

  loadedSprites.walls.stone = await createSVGSprite(
    SVGSprites.walls.stone,
    256,
    256,
  );
  updateProgress();
}
