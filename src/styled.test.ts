import {
  describe,
  it,
  expect,
} from 'vitest';

import {
  styled,
} from './styled';
import {
  boxRecipe,
  shadowRecipe,
  buttonRecipe,
} from './styled.css';

describe('styled', () => {
  it('creates elements with composed className from recipes and string classes', () => {
    const Button = styled('button', buttonRecipe, shadowRecipe, 'ux-card');

    const el = (Button as unknown as (props?: Record<string, unknown>) => { props: Record<string, unknown> })({
      variant: 'primary',
      size: 'small',
      depth: '2',
      className: 'local',
      title: 'ok',
    });

    // class order: [buttonRecipe, shadowRecipe, 'ux-card', props.className]
    const cn = String(el.props.className);
    // vanilla-extract will add generated/scoped class names (hashes), so assert presence of
    // semantic tokens rather than exact equality
    expect(cn).toContain('btn');
    expect(cn).toContain('btn--variant-primary');
    expect(cn).toContain('btn--size-small');
    expect(cn).toContain('shadow');
    expect(cn).toContain('shadow--depth-2');
    expect(cn).toContain('ux-card');
    expect(cn).toContain('local');
    // other props should be forwarded
    expect(el.props.title).toBe('ok');
  });

  it('ignores undefined/false variant props when calling recipe', () => {
    const Box = styled('div', boxRecipe);

    const el = (Box as unknown as (props?: Record<string, unknown>) => { props: Record<string, unknown> })({
      size: undefined,
      fancy: false,
      className: 'c',
    });

    // only base + provided className (vanilla-extract adds generated scope classnames)
    const boxCn = String(el.props.className);
    expect(boxCn).toContain('box');
    expect(boxCn).toContain('c');
  });
});
