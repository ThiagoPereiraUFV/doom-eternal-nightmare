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

  // Weapon sprites (for weapon canvas) - FPS Perspective
  weapons: {
    pistol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="gunMetal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#505050;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2a2a2a;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="slideTop" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#303030;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#606060;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#303030;stop-opacity:1" />
        </linearGradient>
        <filter id="weaponShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Hand holding the gun -->
      <g transform="translate(200, 300)">
         <!-- Thumb -->
         <path d="M -40 -20 Q -20 -50 10 -40" stroke="#4a3a2a" stroke-width="25" stroke-linecap="round" />
         <!-- Fingers -->
         <path d="M 40 -10 Q 60 -40 50 -70" stroke="#4a3a2a" stroke-width="25" stroke-linecap="round" />
      </g>

      <!-- Gun Body (FPS Perspective) -->
      <g transform="translate(200, 300)">
        <!-- Slide Side -->
        <path d="M -30 -20 L -20 -180 L 20 -180 L 30 -20 Z" fill="#2a2a2a" filter="url(#weaponShadow)"/>

        <!-- Slide Top -->
        <path d="M -20 -180 L -15 -200 L 15 -200 L 20 -180 Z" fill="url(#slideTop)" />

        <!-- Barrel Tip -->
        <ellipse cx="0" cy="-200" rx="5" ry="3" fill="#000" />

        <!-- Rear Sight -->
        <path d="M -25 -40 L -25 -60 L -10 -60 L -10 -50 L 10 -50 L 10 -60 L 25 -60 L 25 -40 Z" fill="#1a1a1a" />

        <!-- Front Sight -->
        <rect x="-2" y="-198" width="4" height="6" fill="#00ff00" opacity="0.8" />

        <!-- Ejection Port -->
        <path d="M 10 -120 L 18 -120 L 18 -100 L 12 -100 Z" fill="#1a1a1a" />
      </g>

      <!-- Muzzle Flash (Hidden by default) -->
      <circle cx="200" cy="100" r="0" fill="yellow" opacity="0.5">
        <animate attributeName="r" from="0" to="20" dur="0.1s" begin="click" />
        <animate attributeName="opacity" from="0.8" to="0" dur="0.1s" begin="click" />
      </circle>
    </svg>`,

    shotgun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350">
      <defs>
        <linearGradient id="barrelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="40%" style="stop-color:#4a4a4a;stop-opacity:1" />
          <stop offset="60%" style="stop-color:#4a4a4a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#5a3a1a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#8a5a3a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5a3a1a;stop-opacity:1" />
        </linearGradient>
        <filter id="shotgunShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="4"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Left Hand (Pump) -->
      <g transform="translate(250, 350)">
         <ellipse cx="-40" cy="-100" rx="30" ry="20" fill="#4a3a2a" transform="rotate(-20)" />
         <path d="M -60 -90 Q -40 -130 -10 -120" stroke="#4a3a2a" stroke-width="20" stroke-linecap="round" />
      </g>

      <!-- Shotgun Body (FPS Perspective) -->
      <g transform="translate(250, 350)">
        <!-- Receiver -->
        <rect x="-40" y="-60" width="80" height="60" fill="#2a2a2a" filter="url(#shotgunShadow)" />

        <!-- Barrel -->
        <path d="M -25 -60 L -15 -300 L 15 -300 L 25 -60 Z" fill="url(#barrelGrad)" />

        <!-- Magazine Tube -->
        <path d="M -20 -50 L -12 -280 L 12 -280 L 20 -50 Z" fill="#1a1a1a" transform="translate(0, 10)" />

        <!-- Pump Handle -->
        <path d="M -30 -100 L -22 -200 L 22 -200 L 30 -100 Z" fill="url(#woodGrad)" filter="url(#shotgunShadow)" />
        <!-- Pump Texture -->
        <g stroke="#3a2a0a" stroke-width="1" opacity="0.5">
            <line x1="-28" y1="-110" x2="28" y2="-110" />
            <line x1="-27" y1="-120" x2="27" y2="-120" />
            <line x1="-26" y1="-130" x2="26" y2="-130" />
            <line x1="-25" y1="-140" x2="25" y2="-140" />
            <line x1="-24" y1="-150" x2="24" y2="-150" />
        </g>

        <!-- Sight Bead -->
        <circle cx="0" cy="-295" r="3" fill="gold" />

        <!-- Ejection Port -->
        <rect x="10" y="-50" width="20" height="10" fill="#000" transform="skewY(-10)" />
      </g>
    </svg>`,

    rifle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340">
      <defs>
        <linearGradient id="rifleMetal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#202020;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#404040;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#202020;stop-opacity:1" />
        </linearGradient>
        <pattern id="railPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="2" fill="#101010" />
        </pattern>
        <filter id="rifleShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Hands -->
      <g transform="translate(400, 340)">
         <!-- Left Hand on Handguard -->
         <ellipse cx="-80" cy="-100" rx="35" ry="25" fill="#4a3a2a" transform="rotate(-15)" />
         <path d="M -100 -90 Q -80 -130 -50 -120" stroke="#4a3a2a" stroke-width="20" stroke-linecap="round" />
      </g>

      <!-- Rifle Body (FPS Perspective - Angled Right) -->
      <g transform="translate(400, 340)">
        <!-- Receiver -->
        <path d="M -60 -20 L -50 -150 L 30 -150 L 40 -20 Z" fill="#2a2a2a" filter="url(#rifleShadow)" />

        <!-- Top Rail -->
        <path d="M -50 -150 L -45 -300 L 25 -300 L 30 -150 Z" fill="url(#rifleMetal)" />
        <path d="M -50 -150 L -45 -300 L 25 -300 L 30 -150 Z" fill="url(#railPattern)" opacity="0.5" />

        <!-- Handguard -->
        <path d="M -55 -100 L -48 -280 L 28 -280 L 35 -100 Z" fill="#333" opacity="0.9" />
        <!-- Vents -->
        <g fill="#111">
            <ellipse cx="-10" cy="-140" rx="5" ry="15" />
            <ellipse cx="-8" cy="-180" rx="4" ry="12" />
            <ellipse cx="-6" cy="-220" rx="3" ry="9" />
        </g>

        <!-- Front Sight Post -->
        <path d="M -15 -290 L -15 -320 L -5 -320 L -5 -290 Z" fill="#111" />
        <path d="M 15 -290 L 15 -320 L 5 -320 L 5 -290 Z" fill="#111" />
        <rect x="-1" y="-315" width="2" height="10" fill="#111" />

        <!-- Holographic Sight (Rear) -->
        <g transform="translate(0, -160)">
            <rect x="-25" y="-30" width="50" height="30" fill="#222" stroke="#444" stroke-width="2" />
            <rect x="-20" y="-25" width="40" height="20" fill="#00ffff" opacity="0.2" />
            <circle cx="0" cy="-15" r="2" fill="red" opacity="0.8" />
            <circle cx="0" cy="-15" r="10" stroke="red" stroke-width="1" fill="none" opacity="0.6" />
        </g>

        <!-- Magazine (Hint) -->
        <path d="M -20 -20 L -30 50 L 10 50 L 20 -20 Z" fill="#1a1a1a" />
      </g>
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
    400,
    300,
  );
  updateProgress();

  loadedSprites.weapons.shotgun = await createSVGSprite(
    SVGSprites.weapons.shotgun,
    500,
    350,
  );
  updateProgress();

  loadedSprites.weapons.rifle = await createSVGSprite(
    SVGSprites.weapons.rifle,
    600,
    340,
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
