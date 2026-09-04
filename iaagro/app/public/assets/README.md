# Assets visuais IAgro

Kit pronto para consumo no frontend. Os caminhos abaixo partem da raiz pública do app (`/assets/...`).

## Estrutura

```text
assets/
├── brand/
│   ├── logo-mark.svg
│   ├── logo-mark-512.png
│   ├── logo-horizontal-dark.svg
│   ├── logo-horizontal-dark-520.png
│   ├── logo-horizontal-light.svg
│   ├── logo-horizontal-light-520.png
│   ├── favicon.svg
│   ├── app-icon-192.png
│   └── app-icon-512.png
├── backgrounds/
│   ├── auth-login-field.png
│   ├── auth-register-farmer.png
│   └── auth-recovery-irrigation.png
├── icons/
│   ├── assistant-leaf.svg
│   ├── property-field.svg
│   ├── crop.svg
│   ├── soil.svg
│   ├── irrigation.svg
│   ├── harvest.svg
│   └── weather-clear.svg
├── illustrations/
│   └── empty-field.svg
└── textures/
    └── field-contours.svg
```

## Aplicação da marca

- `logo-horizontal-dark.svg`: cabeçalhos e superfícies claras.
- `logo-horizontal-light.svg`: sidebar e fundos fotográficos escuros.
- `logo-mark.svg`: avatar da marca, loading e espaços compactos.
- `favicon.svg`: favicon e base para ícones de instalação.
- `app-icon-192.png` e `app-icon-512.png`: ícones para `manifest.json`, atalhos e instalação PWA.
- PNGs são fallback para exportação, e-mail ou contextos que não aceitam SVG.
- Altura recomendada do lockup: 36–44 px. Símbolo isolado: 24–40 px.
- Área livre mínima: metade da largura do símbolo ao redor da marca.
- Não recolorir, inclinar, aplicar sombra, gradiente ou separar as partes internas do símbolo.

```jsx
<img
  src="/assets/brand/logo-horizontal-light.svg"
  alt="IAgro"
  width="130"
  height="36"
/>
```

## Fundos de autenticação

| Tela | Asset | `object-position` sugerido |
|---|---|---|
| Login | `/assets/backgrounds/auth-login-field.png` | `50% 55%` |
| Cadastro | `/assets/backgrounds/auth-register-farmer.png` | `48% 50%` |
| Recuperar/redefinir | `/assets/backgrounds/auth-recovery-irrigation.png` | `55% 50%` |

Aplicar a foto como imagem real com `object-fit: cover`; o overlay fica no CSS para manter controle de contraste:

```css
.authVisual {
  position: relative;
  overflow: hidden;
  background: #123d31;
}

.authVisual::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(
    180deg,
    rgb(12 48 39 / 0.30),
    rgb(12 48 39 / 0.72)
  );
  pointer-events: none;
}

.authVisual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 899px) {
  .authVisual { display: none; }
}
```

O gradiente acima é apenas um overlay funcional de contraste sobre fotografia; não deve ser usado como decoração em cards, botões ou backgrounds da aplicação.

## Ícones customizados

Os SVGs de `icons/` usam `currentColor`. Como estão em `public`, use-os como máscara CSS quando a cor precisar acompanhar o componente:

```css
.assetIcon {
  width: 20px;
  height: 20px;
  display: inline-block;
  background: currentColor;
  mask: var(--icon) center / contain no-repeat;
}
```

```jsx
<span
  className={styles.assetIcon}
  style={{ "--icon": "url('/assets/icons/assistant-leaf.svg')" }}
  aria-hidden="true"
/>
```

Use estes ícones apenas para conceitos específicos da marca. Para navegação e ações comuns, utilize uma única família de `react-icons` para manter consistência.

## Textura e estado vazio

- `field-contours.svg`: textura opcional em empty states e superfícies editoriais; opacidade visual máxima de 8%.
- `empty-field.svg`: ausência de registros, análises ou resultados. Deve vir acompanhado de título, explicação curta e CTA; nunca usar a ilustração sozinha.

## Acessibilidade e desempenho

- Todas as imagens fotográficas são decorativas: usar `alt=""` quando a mensagem já estiver em texto.
- Logos recebem `alt="IAgro"`.
- Ícones decorativos usam `aria-hidden="true"`; botões continuam com label textual/ARIA.
- Carregar apenas o fundo da rota atual. Não fazer preload das três fotos.
- Para produção, gerar WebP/AVIF no pipeline mantendo PNG como fallback; não degradar o original no repositório.
- Reservar dimensões no layout para evitar CLS.

## Fonte de verdade

O kit atual é a fonte visual para a implementação nova. Os arquivos legados `public/logoSite.png`, `logo192.png` e `logo512.png` devem ser substituídos somente quando a migração do shell estiver concluída e validada.
