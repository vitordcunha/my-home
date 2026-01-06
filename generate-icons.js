/**
 * Script para gerar ícones PNG do PWA a partir do SVG base
 * 
 * Uso:
 * 1. npm install sharp --save-dev
 * 2. node generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [
  { size: 192, output: 'public/icons/icon-192x192.png' },
  { size: 512, output: 'public/icons/icon-512x512.png' },
  { size: 180, output: 'public/apple-touch-icon.png' },
];

async function generateIcons() {
  const svgPath = 'public/icon-base.svg';
  
  // Verificar se o SVG existe
  if (!fs.existsSync(svgPath)) {
    console.error('❌ Arquivo icon-base.svg não encontrado em public/');
    process.exit(1);
  }

  // Criar pasta icons se não existir
  const iconsDir = 'public/icons';
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('🎨 Gerando ícones PNG...\n');

  for (const { size, output } of sizes) {
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(output);
      
      console.log(`✅ ${output} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${output}:`, error.message);
    }
  }

  console.log('\n🎉 Ícones gerados com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Execute: npm run build');
  console.log('   2. Execute: npm run preview');
  console.log('   3. Teste a instalação do PWA\n');
}

generateIcons().catch(console.error);

