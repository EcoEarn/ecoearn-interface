/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

const rotateY = plugin(function ({ addUtilities }) {
  addUtilities({
    '.rotate-y-180': {
      transform: 'rotateY(180deg)',
    },
  });
});

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brandDefault: 'var(--brand-default)',
        brandDefaultOpacity: 'var(--brand-default-opacity)',
        brandDefaultGreen: 'var(--brand-default-green)',
        brandDefaultGreenOpacity: 'var(--brand-default-green-opacity)',
        brandHover: 'var(--brand-hover)',
        brandPressed: 'var(--brand-pressed)',
        brandDisable: 'var(--brand-disable)',
        brandBg: 'var(--brand-bg)',
        brandFooterBg: 'var(--brand-footer-bg)',
        neutralTitle: 'var(--neutral-title)',
        neutralPrimary: 'var(--neutral-primary)',
        neutralSecondary: 'var(--neutral-secondary)',
        neutralTertiary: 'var(--neutral-tertiary)',
        neutralDisable: 'var(--neutral-disable)',
        neutralBorder: 'var(--neutral-border)',
        neutralDivider: 'var(--neutral-divider)',
        neutralDefaultBg: 'var(--neutral-default-bg)',
        neutralHoverBg: 'var(--neutral-hover-bg)',
        neutralWhiteBg: 'var(--neutral-white-bg)',
        functionalSuccess: 'var(--functional-success)',
        functionalWarning: 'var(--functional-warning)',
        functionalSuccessBg: 'var(--functional-success-bg)',
        functionalWarningBg: 'var(--functional-warning-bg)',
        functionalError: 'var(--functional-error)',
        functionalErrorBg: 'var(--functional-error-bg)',
        functionalErrorHover: 'var(--functional-error-hover)',
        functionalErrorPressed: 'var(--functional-error-pressed)',
        fillMask1: 'var(--fill-mask-1)',
        fillMask2: 'var(--fill-mask-2)',
        fillMask3: 'var(--fill-mask-3)',
      },
      fontSize: {
        xxs: ['10px', '16px'],
        xs: ['12px', '20px'],
        sm: ['14px', '22px'],
        base: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['28px', '36px'],
        '4xl': ['32px', '40px'],
        '5xl': ['40px', '48px'],
        '6xl': ['48px', '56px'],
      },
      boxShadow: {
        selectShadow: '0px 0px 8px 0px var(--fill-mask-4)',
      },
      keyframes: {
        loading: {
          '0%': { transform: 'rotate(0)' },
          '50%': { transform: 'rotate(-180deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
      },
      backgroundImage: {
        inviteCardBg: 'linear-gradient(180deg, #DFECFE 0%, #FFFFFF 50.18%)',
      },
      animation: {
        loading: 'loading 800ms linear infinite',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
    },
    screens: {
      xs: '532px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      large: '2560px',
      main: '1440px',
    },
  },
  plugins: [rotateY],
  corePlugins: {
    preflight: false,
  },
};
