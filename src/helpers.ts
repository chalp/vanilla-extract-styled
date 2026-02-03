export const enum ColorSpace {
  SRGB = 'srgb',
  OKLAB = 'oklab',
}

const getPercent = (amount: number) => Math.round(amount * 100);

export const darken = (
  value: string,
  amount: number,
  colorSpace: ColorSpace = ColorSpace.SRGB,
) => `color-mix(in ${colorSpace}, ${value} ${getPercent(amount)}%, black)`;

export const opacify = (
  value: string,
  amount: number,
  colorSpace: ColorSpace = ColorSpace.SRGB,
) => `color-mix(in ${colorSpace}, ${value} ${getPercent(amount)}%, transparent)`;

export const lighten = (
  value: string,
  amount: number,
  colorSpace: ColorSpace = ColorSpace.SRGB,
) => `color-mix(in ${colorSpace}, ${value} ${getPercent(amount)}%, white)`;
