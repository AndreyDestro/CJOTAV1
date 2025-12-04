export const FONT_FAMILY = '"Press Start 2P", monospace';

// Configuracao padrao de sombra/contorno usada em todos os textos do jogo
const DEFAULT_SHADOW = {
  offsetX: 6,
  offsetY: 6,
  color: '#000000',
  blur: 0,
  strokeThickness: 6
};

// Aplica sombra e contorno consistentes apos criar um texto Phaser
export function applyTextEffects(text, overrides = {}) {
  const shadow = { ...DEFAULT_SHADOW, ...overrides };
  text.setShadow(shadow.offsetX, shadow.offsetY, shadow.color, shadow.blur, true, true);
  text.setStroke(shadow.color, shadow.strokeThickness);
  return text;
}

// Fabrica centralizada para criar textos com identidade visual do projeto
export function createStyledText(scene, x, y, message, styleOverrides = {}, shadowOverrides = {}) {
  const style = {
    fontFamily: FONT_FAMILY,
    color: '#ffffff',
    ...styleOverrides
  };

  const text = scene.add.text(x, y, message, style);
  applyTextEffects(text, shadowOverrides);
  return text;
}
