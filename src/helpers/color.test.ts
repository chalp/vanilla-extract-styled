import {
  describe,
  it,
  expect,
} from 'vitest';

import {
  darken, lighten, opacify,
} from './color';

describe('color helpers', () => {
  it('exports helpers that produce CSS color-mix strings', () => {
    expect(darken('#ffcc00', 0.15)).toContain('color-mix');
    expect(darken('#ffcc00', 0.15)).toContain('15%');

    expect(lighten('#002244', 0.1)).toContain('color-mix');
    expect(lighten('#002244', 0.1)).toContain('10%');

    expect(opacify('#000000', 0.5)).toContain('color-mix');
    expect(opacify('#000000', 0.5)).toContain('50%');
  });
});
