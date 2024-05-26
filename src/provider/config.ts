import { ThemeConfig } from 'antd';

export const AELFDProviderTheme: ThemeConfig = {
  token: {
    colorPrimary: '#7D48E8',
    colorPrimaryHover: '#915BFF',
    colorPrimaryActive: '#6434C6',
  },
  components: {
    Input: {
      borderRadius: 12,
      borderRadiusSM: 12,
      paddingInlineSM: 11,
    },
    Table: {
      headerColor: 'var(--neutral-secondary)',
      headerSplitColor: 'var(--brand-bg)',
      headerBg: 'var(--brand-bg)',
      colorBgContainer: 'var(--brand-bg)',
      rowHoverBg: 'var(--brand-footer-bg)',
    },
    Layout: {
      bodyBg: 'var(--neutral-white-bg)',
    },
    Tooltip: {
      colorBgSpotlight: 'var(--fill-mask-2)',
      colorTextLightSolid: 'var(--neutral-white-bg)',
      borderRadius: 4,
    },
    Button: {
      // borderColorDisabled: 'var(--brand-disable)',
      // colorTextDisabled: '#fff',
      // colorBgContainerDisabled: 'var(--brand-disable)',
      borderRadius: 12,
    },
  },
};
export const ANTDProviderTheme: ThemeConfig = {
  token: {
    colorPrimary: '#7D48E8',
    colorPrimaryHover: '#915BFF',
    colorPrimaryActive: '#6434C6',
  },
  components: {
    Input: {
      borderRadius: 12,
      paddingBlock: 11,
      inputFontSize: 16,
    },
    Form: {
      itemMarginBottom: 16,
      labelRequiredMarkColor: '#FF703D',
      labelFontSize: 18,
      verticalLabelMargin: '0 0 8px',
    },
    Segmented: {
      itemSelectedBg: 'var(--brand-default)',
      itemActiveBg: 'var(--brand-default)',
      itemColor: 'var(--neutral-secondary)',
      itemSelectedColor: '#fff',
      itemHoverColor: 'var(--neutral-secondary)',
    },
  },
};
